'use strict';

// Hardened drop-in replacement for `deepmerge` 4.x (MIT, Copyright (c) 2012
// James Halliday, Josh Duff, and contributors) with fail-closed prototype
// poisoning protection addressing GHSA-gcqx-w48m-w2h4 / CVE-2026-93753.

function isNonNullObject(value) {
  return Boolean(value) && typeof value === 'object';
}

var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
  return value.$$typeof === REACT_ELEMENT_TYPE;
}

function isSpecial(value) {
  var stringValue = Object.prototype.toString.call(value);
  return (
    stringValue === '[object RegExp]' ||
    stringValue === '[object Date]' ||
    isReactElement(value)
  );
}

function defaultIsMergeableObject(value) {
  return isNonNullObject(value) && !isSpecial(value);
}

function emptyTarget(val) {
  return Array.isArray(val) ? [] : {};
}

function cloneUnlessOtherwiseSpecified(value, options) {
  return options.clone !== false && options.isMergeableObject(value)
    ? deepmerge(emptyTarget(value), value, options)
    : value;
}

function defaultArrayMerge(target, source, options) {
  return target.concat(source).map(function (element) {
    return cloneUnlessOtherwiseSpecified(element, options);
  });
}

function getMergeFunction(key, options) {
  if (!options.customMerge) {
    return deepmerge;
  }
  var customMerge = options.customMerge(key);
  return typeof customMerge === 'function' ? customMerge : deepmerge;
}

function getEnumerableOwnPropertySymbols(target) {
  return Object.getOwnPropertySymbols
    ? Object.getOwnPropertySymbols(target).filter(function (symbol) {
        return Object.prototype.propertyIsEnumerable.call(target, symbol);
      })
    : [];
}

function getKeys(target) {
  return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}

function isForbiddenKey(key) {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

function propertyIsOnObject(object, property) {
  if (!isNonNullObject(object) && typeof object !== 'function') {
    return false;
  }
  try {
    return property in object;
  } catch (_) {
    return false;
  }
}

// Fail-closed guard against prototype poisoning across plain objects,
// null-prototype objects, and throwing Proxy `has` traps.
function propertyIsUnsafe(target, key) {
  if (isForbiddenKey(key)) {
    return true;
  }
  if (!isNonNullObject(target) && typeof target !== 'function') {
    return false;
  }
  var existsOnTarget;
  try {
    existsOnTarget = key in target;
  } catch (_) {
    return true;
  }
  return (
    existsOnTarget &&
    !(
      Object.prototype.hasOwnProperty.call(target, key) &&
      Object.prototype.propertyIsEnumerable.call(target, key)
    )
  );
}

function defineSafeProperty(destination, key, value) {
  Object.defineProperty(destination, key, {
    value: value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function mergeObject(target, source, options) {
  var destination = {};
  if (options.isMergeableObject(target)) {
    getKeys(target).forEach(function (key) {
      if (isForbiddenKey(key)) {
        return;
      }
      defineSafeProperty(
        destination,
        key,
        cloneUnlessOtherwiseSpecified(target[key], options)
      );
    });
  }
  getKeys(source).forEach(function (key) {
    if (propertyIsUnsafe(target, key)) {
      return;
    }

    if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
      defineSafeProperty(
        destination,
        key,
        getMergeFunction(key, options)(target[key], source[key], options)
      );
    } else {
      defineSafeProperty(
        destination,
        key,
        cloneUnlessOtherwiseSpecified(source[key], options)
      );
    }
  });
  return destination;
}

function deepmerge(target, source, options) {
  options = options || {};
  options.arrayMerge = options.arrayMerge || defaultArrayMerge;
  options.isMergeableObject = options.isMergeableObject || defaultIsMergeableObject;
  options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

  var sourceIsArray = Array.isArray(source);
  var targetIsArray = Array.isArray(target);
  var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

  if (!sourceAndTargetTypesMatch) {
    return cloneUnlessOtherwiseSpecified(source, options);
  } else if (sourceIsArray) {
    return options.arrayMerge(target, source, options);
  } else {
    return mergeObject(target, source, options);
  }
}

deepmerge.all = function deepmergeAll(array, options) {
  if (!Array.isArray(array)) {
    throw new Error('first argument should be an array');
  }

  return array.reduce(function (prev, next) {
    return deepmerge(prev, next, options);
  }, {});
};

module.exports = deepmerge;
