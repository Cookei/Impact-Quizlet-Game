import Quizlet from 'dataset';
import Fun from 'dataset/sets/Fun';
import {
  CardSide,
  Dataset,
  MediaType,
  SerializedMedia,
  SerializedMediaImage,
  SerializedMediaText,
  StudiableItem,
} from 'dataset/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const IMAGE_HEIGHT = 300;
const IMAGE_WIDTH = 500;

const UI = styled.div`
  position: absolute;
  width: 100%;
  height: 50px;
  background-color: green;
  display: flex;
`;

const GameScreen = styled.div`
  position: absolute;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  background-color: aliceblue;
  overflow: hidden;
`;

const AnswerRow = styled.div`
  position: absolute;
  height: 100%;
  width: 300px;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
`;

const Answer = styled.button<{ $imgOpacity?; $correct; $reveal }>`
  position: relative;
  height: 23%;
  margin: 10px;
  width: 100%;
  background-color: gray;
  border: none;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  & img {
    object-fit: cover;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: ${props => props.$imgOpacity};
  }
  & h3 {
    position: absolute;
  }
  & div {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.5;
    background-color: ${props =>
      props.$reveal ? (props.$correct ? 'green' : 'red') : 'gray'};
  }
`;

const Player = styled.div`
  position: absolute;
  height: 0;
  width: 0;
  border-top: 50px solid transparent;
  border-bottom: 50px solid transparent;
  border-left: 100px solid blue;
  top: 50px;
`;

const TermToolbox = styled.div`
  position: absolute;
  width: 100px;
  height: 100px;
  background-color: yellow;
`;

export default function Game() {
  const quizletSet = Quizlet.getRandomSet();

  const [answers, setAnswers] = useState(null);
  const [term, setTerm] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [stage, setStage] = useState(0);

  function generateAnswers(set: Dataset, n: number) {
    const suitableItems = set.studiableItem;
    const shuffled = suitableItems.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, n);
    const correctIndex = Math.floor(Math.random() * selected.length);
    const output = [];
    for (let i = 0; i < selected.length; i++) {
      let correct = false;
      if (i == correctIndex) {
        setTerm(selected[i].cardSides[0].media[0]['plainText']);
        correct = true;
      }
      let plainText = null;
      let media = null;
      for (let j = 0; j < selected[i].cardSides[1].media.length; j++) {
        if (selected[i].cardSides[1].media[j].type == 1) {
          plainText = selected[i].cardSides[1].media[j]['plainText'];
        }
        if (selected[i].cardSides[1].media[j].type == 2) {
          media = selected[i].cardSides[1].media[j]['url'];
        }
      }
      output.push({
        plainText: plainText,
        media: media,
        correct: correct,
        key: selected[i].id,
      });
    }
    return output;
  }

  function click(correct) {
    setReveal(true);
    if (correct) setScore(score + 100);
    else setLives(lives - 1);
  }

  useEffect(() => {
    setAnswers(generateAnswers(quizletSet, 4));
  }, []);

  return (
    <GameScreen>
      <UI>
        {`lives: ${lives}
      score: ${score}
      stage: ${stage}`}
      </UI>
      <Player>
        <TermToolbox></TermToolbox>
      </Player>
      <AnswerRow>
        {answers != null
          ? answers.map((e, i) => {
              if (e.media != null) {
                return e.plainText != '' ? (
                  <Answer
                    key={e.key}
                    id={i}
                    onClick={() => !reveal && click(e.correct)}
                    $imgOpacity={0.3}
                    $correct={e.correct}
                    $reveal={reveal}
                  >
                    <img src={e.media}></img>
                    <h3>{e.plainText}</h3>
                    <div />
                  </Answer>
                ) : (
                  <Answer
                    key={e.key}
                    id={i}
                    onClick={() => !reveal && click(e.correct)}
                    $correct={e.correct}
                    $reveal={reveal}
                  >
                    <img src={e.media}></img>
                    <div />
                  </Answer>
                );
              } else {
                return (
                  <Answer
                    key={e.key}
                    id={i}
                    onClick={() => !reveal && click(e.correct)}
                    $correct={e.correct}
                    $reveal={reveal}
                  >
                    <h3>{e.plainText}</h3>
                    <div />
                  </Answer>
                );
              }
            })
          : null}
      </AnswerRow>
    </GameScreen>
  );
}
