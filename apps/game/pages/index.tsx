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
import { motion } from 'framer-motion';
import useFitText from 'use-fit-text';

const UI_HEIGHT = 50;

// #region CSS
const UI = styled.div`
  position: absolute;
  width: 100%;
  height: ${UI_HEIGHT}px;
  background-color: green;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const AnswerRow = styled(motion.div)`
  position: absolute;
  height: calc(100% - ${UI_HEIGHT}px);
  top: ${UI_HEIGHT}px;
  width: 300px;
  left: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
`;

const ANSWER_HEIGHT = 23;

const Answer = styled(motion.button)<{ $imgOpacity?; $correct; $reveal; $fontSize }>`
  position: relative;
  height: ${ANSWER_HEIGHT}%;
  margin: 10px;
  width: 100%;
  background-color: #c0d7e094;
  border: none;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  visibility: 'visible';
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
    padding: 10px;
    position: absolute;
  }
  & div {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.5;
    background-color: ${props => (props.$reveal ? (props.$correct ? 'green' : 'red') : '')};
  }
`;

const PLAYER_INIT_HEIGHT = 50;
const PLAYER_WIDTH = 100;
const PLAYER_INIT_LEFT = 70;

const Player = styled(motion.div)<{ $playerTop; $playerHeight }>`
  position: absolute;
  height: 0;
  width: 0;
  left: ${PLAYER_INIT_LEFT}px;
  top: ${`calc(50% - ${PLAYER_INIT_HEIGHT}px)`};
  border-top: ${props => props.$playerHeight}px solid transparent;
  border-bottom: ${props => props.$playerHeight}px solid transparent;
  border-left: ${PLAYER_WIDTH}px solid blue;
`;

const Timer = styled(motion.svg)`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

// #endregion

export default function Game() {
  const quizletSet = Quizlet.getRandomSet();

  // #region ReactHooks
  const [answers, setAnswers] = useState(null);
  const [term, setTerm] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [stage, setStage] = useState(0);
  const [playerTop, setPlayerTop] = useState(0);
  const [playerAnimation, setPlayerAnimation] = useState('initial');
  const [playerHeight, setPlayerHeight] = useState(50);
  const [enemyAnimation, setEnemyAnimation] = useState('initial');
  const { fontSize, ref } = useFitText({ minFontSize: 5 });
  const [timerAnimation, setTimerAnimation] = useState('initial');
  const [difficultyTimer, setDifficultyTimer] = useState(7);
  const [clickedIndex, setClickedIndex] = useState(null);
  // #endregion

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
  const playerAnimationVariants = {
    move: {
      top: `${playerTop + ANSWER_HEIGHT / 2 + playerHeight}px`,
    },
    attack: {
      left: `80vw`,
      top: `${playerTop + ANSWER_HEIGHT / 2 + playerHeight}px`,
      transition: {
        duration: 0.8,
        ease: 'anticipate',
        type: 'tween',
      },
    },
    retreat: {
      left: `${PLAYER_INIT_LEFT}px`,
      top: `${playerTop + ANSWER_HEIGHT / 2}px`,
    },
    initial: {
      left: `${PLAYER_INIT_LEFT}px`,
      top: `calc(50% - ${PLAYER_INIT_HEIGHT}px)`,
    },
  };
  const answerRowAnimationVariants = {
    initial: {
      left: `100vw`,
    },
    enter: {
      left: `70vw`,
      transition: {
        duration: 2,
        ease: 'circOut',
        type: 'tween',
      },
    },
    attack: {
      left: `-50vw`,
      transition: {
        duration: 0.8,
        ease: 'circIn',
        type: 'tween',
      },
    },
  };
  const timerAnimationVariants = {
    wait: {
      pathLength: 1,
      stroke: '#00ff40',
    },
    complete: {
      pathLength: 0,
      stroke: '#ff0000',
      transition: {
        duration: difficultyTimer,
      },
    },
  };

  function click(correct, i) {
    setReveal(true);
    if (correct) setScore(score + 100);
    else setLives(lives - 1);
    setClickedIndex(i);
    const bindingRect = document.getElementById(`card-${i}`).getBoundingClientRect();
    setPlayerTop(bindingRect.top);
    setPlayerAnimation('move');
    setPlayerHeight(25);
    setTimerAnimation('wait');
  }

  function playerAnimationCycle() {
    if (playerAnimation == 'move') setPlayerAnimation('attack');
    if (playerAnimation == 'attack') {
      document.getElementById(`card-${clickedIndex}`).style.setProperty('visibility', 'hidden');
      setPlayerAnimation('retreat');
    }
    if (playerAnimation == 'retreat') {
      setPlayerAnimation('initial');
      setPlayerHeight(50);
      setStage(stage + 1);
    }
  }

  function enemyAnimationCycle() {
    if (enemyAnimation == 'initial') {
      setEnemyAnimation('enter');
      setTimerAnimation('complete');
    }
    if (enemyAnimation == 'attack') {
      setTimerAnimation('initial');
      setLives(lives - 1);
      reset();
    }
  }

  function timerAnimationCycle() {
    if (timerAnimation == 'complete') {
      setReveal(true);
      setEnemyAnimation('attack');
    }
  }

  function reset() {
    setAnswers(generateAnswers(quizletSet, 4));
    setReveal(false);
    setEnemyAnimation('initial');
  }

  useEffect(() => {
    setTimerAnimation('initial');
    reset();
  }, [stage]);

  return (
    <GameScreen>
      <Timer>
        <motion.circle
          initial={{ pathLength: 1, stroke: '#00ff40' }}
          variants={timerAnimationVariants}
          animate={timerAnimation}
          onAnimationComplete={() => timerAnimationCycle()}
          cx={`50%`}
          cy={`50%`}
          r={100}
          fill="transparent"
          strokeWidth={15}
        />
      </Timer>
      <Player
        $playerTop={playerTop}
        $playerHeight={playerHeight}
        variants={playerAnimationVariants}
        animate={playerAnimation}
        onAnimationComplete={() => playerAnimationCycle()}
      />
      <AnswerRow
        variants={answerRowAnimationVariants}
        animate={enemyAnimation}
        onAnimationComplete={enemyAnimationCycle}
      >
        {answers != null
          ? answers.map((e, i) => {
              if (e.media != null) {
                return e.plainText != '' ? (
                  <Answer
                    layout
                    key={e.key}
                    id={`card-${i}`}
                    onClick={() => !reveal && click(e.correct, i)}
                    $imgOpacity={0.3}
                    $correct={e.correct}
                    $reveal={reveal}
                    $fontSize={fontSize}
                    whileHover={{ scale: reveal ? 1 : 1.04 }}
                    whileTap={{ scale: reveal ? 1 : 0.96 }}
                  >
                    <img src={e.media}></img>
                    <h3 ref={ref}>{e.plainText}</h3>
                    <div />
                  </Answer>
                ) : (
                  <Answer
                    layout
                    key={e.key}
                    id={`card-${i}`}
                    onClick={() => !reveal && click(e.correct, i)}
                    $correct={e.correct}
                    $reveal={reveal}
                    $fontSize={fontSize}
                    whileHover={{ scale: reveal ? 1 : 1.04 }}
                    whileTap={{ scale: reveal ? 1 : 0.96 }}
                  >
                    <img src={e.media}></img>
                    <div />
                  </Answer>
                );
              } else {
                return (
                  <Answer
                    layout
                    key={e.key}
                    id={`card-${i}`}
                    onClick={() => !reveal && click(e.correct, i)}
                    $correct={e.correct}
                    $reveal={reveal}
                    $fontSize={fontSize}
                    whileHover={{ scale: reveal ? 1 : 1.04 }}
                    whileTap={{ scale: reveal ? 1 : 0.96 }}
                  >
                    <h3 ref={ref}>{e.plainText}</h3>
                    <div />
                  </Answer>
                );
              }
            })
          : null}
      </AnswerRow>
      <UI>
        <div>{`lives: ${lives}`}</div>
        <h1>{term}</h1>
        <div>{`score: ${score}`}</div>
      </UI>
    </GameScreen>
  );
}
