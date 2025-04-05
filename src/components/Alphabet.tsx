import React from 'react';
import PronunciationButton from './PronunciationButton';

interface AlphabetItemProps {
  letter: string;
  pronunciation: string;
  example: string;
  russianWord?: string;
  englishWord?: string;
}

interface AlphabetProps {
  data: AlphabetItemProps[];
}

const Alphabet: React.FC<AlphabetProps> = ({ data }) => {
  return (
    <div className="section">
      <h2>Russian Alphabet</h2>
      <div className="alphabet-container">
        {data.map((item, index) => (
          <div className="alphabet-card" key={index}>
            <div className="letter-header">
              <div className="letter">{item.letter}</div>
              <PronunciationButton text={item.letter} />
            </div>
            
            <div className="pronunciation">
              <strong>Pronunciation:</strong> <span className="pronunciation-text">{item.pronunciation} {item.example}</span>
            </div>
            
            {item.russianWord && (
              <div className="example">
                <strong>Example:</strong> <span className="example-word">{item.russianWord}</span> 
                {item.englishWord && <span className="example-translation"> ({item.englishWord})</span>}
                {item.russianWord && (
                  <PronunciationButton 
                    text={item.russianWord} 
                    className="example-pronunciation"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alphabet;