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
            <div className="letter-container">
              <div className="letter-header">
                <div className="letter-pair">
                  <span className="letter-uppercase">{item.letter}</span>
                  <span className="letter-lowercase">{item.letter.toLowerCase()}</span>
                </div>
              </div>
              
              <div className="letter-underline"></div>
              
              <div className="pronunciation-button-wrapper">
                <PronunciationButton 
                  text={item.letter.toLowerCase()} 
                  audioCategory="alphabet"
                  useLocalAudio={true}
                />
              </div>
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
                    audioCategory="examples"
                    useLocalAudio={true}
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