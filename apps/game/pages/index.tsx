import Quizlet from 'dataset';
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
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import useFitText from 'use-fit-text';
import Fun from 'dataset/sets/Fun';
import Games from 'dataset/sets/Games';
import Geography from 'dataset/sets/Geography';
import Humanity from 'dataset/sets/Humanities';
import Language from 'dataset/sets/Language';
import Science from 'dataset/sets/Science';
import Tabs from '../components/tabs';
const UI_HEIGHT = 75;

// #region CSS
const UI = styled.div`
  position: absolute;
  width: 100%;
  height: ${UI_HEIGHT}px;
  background-color: #7fffd4da;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  border-bottom: 5px solid #4ed3a6;
  box-shadow: 0px 5px black;
`;

const GameScreen = styled.div`
  position: absolute;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
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
  background-color: '#f0f8ff7f';
  border: none;
  border-radius: 10px;
  box-shadow: 5px 5px black;
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
    background-color: ${props => (props.$reveal ? (props.$correct ? '#00ff2a' : '#ff000096') : '')};
  }
`;

const tabList = [
  {
    title: 'Fun',
    id: 'Fun',
    content: Fun.getAllSetsMap(),
  },
  {
    title: 'Games',
    id: 'Games',
    content: Games.getAllSetsMap(),
  },
  {
    title: 'Geography',
    id: 'Geography',
    content: Geography.getAllSetsMap(),
  },
  {
    title: 'Humanities',
    id: 'Humanity',
    content: Humanity.getAllSetsMap(),
  },
  {
    title: 'Language',
    id: 'Language',
    content: Language.getAllSetsMap(),
  },
  {
    title: 'Science',
    id: 'Science',
    content: Science.getAllSetsMap(),
  },
];
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
  border-left: ${PLAYER_WIDTH}px solid #eaff7f;
  filter: drop-shadow(5px 5px black);
`;

const Timer = styled(motion.svg)`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const ModalBackdrop = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: #000000e1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Modal = styled(motion.div)`
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #7ed1bc;
  border-bottom: solid;
  border-width: 10px;
  border-color: #3b7969;
  overflow: hidden;
`;

const PowerUpList = [
  {
    name: 'lasers',
    description: 'Eliminates 1 answer choice until the next powerup offering',
  },
  {
    name: 'health',
    description: 'Gain 1 health',
  },
  {
    name: 'score',
    description: 'Instantly gain 200 score',
  },
  {
    name: 'timer',
    description: 'Increased timer duration until the next upgrade choice',
  },
  {
    name: 'multiplier',
    description:
      'Gain a 2x multiplier if you get 3 correct in a row. Lose 200 score for each incorrect. Lasts until the next powerup offering',
  },
];

const PowerUpOfferingRow = styled(motion.ul)`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0;
`;

const PowerUpOffering = styled(motion.button)`
  width: 200px;
  height: 200px;
  margin: 10px;
  display: flex;
  flex-direction: column;
  background-color: #7fffd4;
  border-radius: 10px;
  box-shadow: 5px 5px black;
`;

const NUM_TILL_POWERUP = 4;

const Heart = styled(motion.div)`
  display: inline;
  color: red;
  font-size: 3rem;
  margin: 5px;
  filter: drop-shadow(2px 2px black);
`;

const Restart = styled(motion.button)`
  min-width: 200px;
  height: 75px;
  background-color: #32dba3;
  border: hidden;
  border-radius: 5px;
  margin: 10px;
  border-bottom: solid;
  border-width: 5px;
  border-color: #95d8c2;
  box-shadow: 5px 5px black;
`;

const Laser = styled(motion.div)`
  width: 100vw;
  height: ${ANSWER_HEIGHT}%;
  background-color: red;
  position: absolute;
`;

// #endregion

export default function Game() {
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
  const [difficultyTimer, setDifficultyTimer] = useState(6);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [pause, setPause] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [offeredPowerUps, setOfferedPowerUps] = useState(null);
  const [lasersActive, setLasersActive] = useState(false);
  const [multiplierActive, setMultiplierActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [livesArray, setLivesArray] = useState([0, 0, 0]);
  const [summonLaser, setSummonLaser] = useState(false);
  const [laseredHeight, setLaseredHeight] = useState(null);
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
        duration: 1,
        ease: 'circOut',
        type: 'tween',
      },
    },
    wait: {
      left: `70vw`,
    },
    attack: {
      left: `-50vw`,
      transition: {
        duration: 1.4,
        ease: 'anticipate',
        type: 'tween',
      },
    },
  };
  const answerAnimationVariants = {
    initial: {
      scale: 1,
      opacity: 1,
    },
    hidden: {
      scale: 1.05,
      opacity: 0,
      transition: {
        duration: 0.2,
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
  const modalAnimationVariants = {
    hidden: {
      width: 0,
      height: 0,
      borderRadius: '500px',
    },
    visible: {
      y: 0,
      width: 'clamp(50%, 700px, 90%)',
      height: 'clamp(70%, 500px, 90%)',
      borderRadius: '15px',
      transition: {
        duration: 1,
        type: 'spring',
      },
    },
    exit: {
      width: 0,
      height: 0,
      borderRadius: '500px',
    },
  };
  const laserAnimationVariants = {
    hidden: {
      top: `${laseredHeight}px`,
      right: '100vw',
      opacity: 1,
    },
    attack: {
      top: `${laseredHeight}px`,
      right: '0vw',
      opacity: 1,
      transition: {
        duration: 0.2,
        type: 'tween',
        ease: 'easeIn',
      },
    },
    exit: {
      top: `${laseredHeight}px`,
      right: '0vw',
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  function click(correct, i) {
    setReveal(true);
    if (correct) {
      if (multiplierActive) setScore(score + 100 * 2);
      else setScore(score + 100);
    } else {
      setLives(lives - 1);
      if (multiplierActive) {
        setScore(score - 200);
      }
      setLivesArray(livesArray.splice(1));
    }
    setClickedIndex(i);
    const bindingRect = document.getElementById(`card-${i}`).getBoundingClientRect();
    setPlayerTop(bindingRect.top);
    setPlayerAnimation('move');
    setPlayerHeight(25);
    setEnemyAnimation('wait');
    setTimerAnimation('wait');
  }
  function playerAnimationCycle() {
    if (playerAnimation == 'initial') {
      if (stage != 0 && stage % NUM_TILL_POWERUP == 0 && lives > 0) {
        setLasersActive(false);
        setMultiplierActive(false);
        setPause(true);
        setModalOpen(true);
        pickPowerUps();
      } else {
        setStage(stage + 1);
      }
    }
    if (playerAnimation == 'move') setPlayerAnimation('attack');
    if (playerAnimation == 'attack') {
      document.getElementById(`card-${clickedIndex}`).style.setProperty('visibility', 'hidden');
      setPlayerAnimation('retreat');
    }
    if (playerAnimation == 'retreat') {
      setPlayerAnimation('initial');
      setPlayerHeight(50);
    }
  }
  function enemyAnimationCycle() {
    if (enemyAnimation == 'initial') {
      setEnemyAnimation('enter');
    }
    if (enemyAnimation == 'enter') {
      setEnemyAnimation('wait');
      setTimerAnimation('complete');
      if (lasersActive == true) {
        let laserIndex = Math.floor(Math.random() * 4);
        for (let i = 0; i < 4; i++) {
          if (answers[i].correct && laserIndex == i) {
            i = 0;
            laserIndex = Math.floor(Math.random() * 4);
          }
        }
        setSummonLaser(true);
        const laseredElement = document.getElementById(`card-${laserIndex}`);
        laseredElement.style.setProperty('visibility', 'hidden');
        setLaseredHeight(laseredElement.getBoundingClientRect().top);
      }
    }
    if (enemyAnimation == 'attack') {
      setTimerAnimation('initial');
      setLives(lives - 1);
      if (multiplierActive) {
        setScore(score - 200);
      }
      setLivesArray(livesArray.splice(1));
      setEnemyAnimation('initial');
      if (stage != 0 && stage % NUM_TILL_POWERUP == 0 && lives > 0) {
        setLasersActive(false);
        setMultiplierActive(false);
        setPause(true);
        setModalOpen(true);
        pickPowerUps();
      } else {
        setStage(stage + 1);
        reset();
      }
    }
  }
  function timerAnimationCycle() {
    if (timerAnimation == 'complete') {
      setReveal(true);
      setEnemyAnimation('attack');
    }
  }
  function laserAnimationCycle(animation) {
    if (animation == 'attack') setSummonLaser(false);
  }

  function pickPowerUps() {
    const finalPowerUps = [];
    const shuffled = PowerUpList.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    for (let i of selected) {
      finalPowerUps.push(i);
    }
    setOfferedPowerUps(finalPowerUps);
  }
  function evaluatePowerUp(powerUp: string) {
    setStage(stage + 1);
    if (difficultyTimer >= 1) {
      setDifficultyTimer(difficultyTimer - 1);
    }
    switch (powerUp) {
      case 'lasers':
        setLasersActive(true);
        break;
      case 'health':
        setLives(lives + 1);
        setLivesArray([...livesArray, 0]);
        break;
      case 'score':
        setScore(score + 200);
        break;
      case 'timer':
        setDifficultyTimer(difficultyTimer + 1);
        break;
      case 'multiplier':
        setMultiplierActive(true);
        break;
    }
  }

  function reset() {
    if (selectedSet == null) return;
    if (lives <= 0) {
      setGameOver(true);
      setModalOpen(true);
      setPause(true);
    }
    setAnswers(generateAnswers(selectedSet, 4));
    setReveal(false);
  }
  useEffect(() => {
    setEnemyAnimation('initial');
  }, [answers]);

  useEffect(() => {
    if (playing) {
      setTimerAnimation('initial');
      reset();
    }
  }, [stage]);

  useEffect(() => {
    reset();
    setEnemyAnimation('initial');
  }, [selectedSet]);

  function restartGame() {
    setAnswers(null);
    setTerm(null);
    setReveal(false);
    setScore(0);
    setLives(3);
    setStage(0);
    setPlayerTop(0);
    setPlayerAnimation('initial');
    setPlayerHeight(50);
    setEnemyAnimation('initial');
    setTimerAnimation('initial');
    setDifficultyTimer(6);
    setClickedIndex(null);
    setModalOpen(true);
    setPlaying(false);
    setPause(false);
    setSelectedSet(null);
    setOfferedPowerUps(null);
    setLasersActive(false);
    setMultiplierActive(false);
    setGameOver(false);
    setLivesArray([0, 0, 0]);
  }

  return (
    <GameScreen style={{ backgroundColor: '#7cc2b0' }}>
      {playing && !gameOver && (
        <div>
          {!pause && (
            <Timer>
              <motion.circle
                initial={{ pathLength: 1, stroke: '#00ff40', strokeWidth: '20px' }}
                variants={timerAnimationVariants}
                animate={timerAnimation}
                onAnimationComplete={() => timerAnimationCycle()}
                cx={`50%`}
                cy={`50%`}
                r={100}
                fill="transparent"
                strokeWidth={15}
                style={{ filter: 'drop-shadow(5px 5px black)' }}
              />
            </Timer>
          )}

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
            {answers &&
              answers.map((e, i) => {
                if (e.media != null) {
                  return e.plainText != '' ? (
                    <Answer
                      variants={answerAnimationVariants}
                      initial="initial"
                      layout
                      key={e.key}
                      id={`card-${i}`}
                      onClick={() => !reveal && enemyAnimation == 'wait' && click(e.correct, i)}
                      $imgOpacity={0.3}
                      $correct={e.correct}
                      $reveal={reveal}
                      $fontSize={fontSize}
                      whileHover={{ scale: reveal && enemyAnimation == 'wait' ? 1 : 1.04 }}
                      whileTap={{ scale: reveal && enemyAnimation == 'wait' ? 1 : 0.96 }}
                      style={{ visibility: 'visible' }}
                    >
                      <img src={e.media}></img>
                      <h3 ref={ref}>{e.plainText}</h3>
                      <div />
                    </Answer>
                  ) : (
                    <Answer
                      variants={answerAnimationVariants}
                      initial="initial"
                      layout
                      key={e.key}
                      id={`card-${i}`}
                      onClick={() => !reveal && enemyAnimation == 'wait' && click(e.correct, i)}
                      $correct={e.correct}
                      $reveal={reveal}
                      $fontSize={fontSize}
                      whileHover={{ scale: reveal && enemyAnimation == 'wait' ? 1 : 1.04 }}
                      whileTap={{ scale: reveal && enemyAnimation == 'wait' ? 1 : 0.96 }}
                      style={{ visibility: 'visible' }}
                    >
                      <img src={e.media}></img>
                      <div />
                    </Answer>
                  );
                } else {
                  return (
                    <Answer
                      variants={answerAnimationVariants}
                      initial="initial"
                      layout
                      key={e.key}
                      id={`card-${i}`}
                      onClick={() => !reveal && enemyAnimation == 'wait' && click(e.correct, i)}
                      $correct={e.correct}
                      $reveal={reveal}
                      $fontSize={fontSize}
                      whileHover={{ scale: reveal && enemyAnimation == 'wait' ? 1 : 1.04 }}
                      whileTap={{ scale: reveal && enemyAnimation == 'wait' ? 1 : 0.96 }}
                      style={{ visibility: 'visible' }}
                    >
                      <h3 ref={ref}>{e.plainText}</h3>
                      <div />
                    </Answer>
                  );
                }
              })}
          </AnswerRow>
          <AnimatePresence initial={true} mode="wait" onExitComplete={() => null}>
            {lasersActive && summonLaser && (
              <Laser
                variants={laserAnimationVariants}
                initial="hidden"
                animate="attack"
                exit="exit"
                onAnimationComplete={laserAnimationCycle}
              />
            )}
          </AnimatePresence>

          <UI>
            <div style={{ margin: '20px' }}>
              {livesArray.map((e, i) => (
                <Heart key={`${i}`}>{'\u2764'}</Heart>
              ))}
            </div>
            <h1 style={{ position: 'absolute', left: '50%', transform: 'translate(-50%, 0)' }}>{term}</h1>
            <h2 style={{ margin: '20px' }}>{`Score: ${score}`}</h2>
          </UI>
        </div>
      )}
      <AnimatePresence initial={true} mode="wait" onExitComplete={() => null}>
        {modalOpen && (
          <ModalBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {playing == false ? (
              <Modal
                layout
                variants={modalAnimationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={e => e.stopPropagation()}
              >
                <div>
                  <h1>Impact!</h1>
                  <div>
                    <h2>Instructions</h2>
                    <p>
                      Pick a dataset to start playing! Click the corresponding definition that matches the term. Gain
                      powerups to continue pushing forward!
                    </p>
                  </div>
                </div>
                <div>
                  <Tabs
                    tabs={tabList}
                    callback={val => {
                      setSelectedSet(val);
                      setPlaying(true);
                      setModalOpen(false);
                    }}
                  ></Tabs>
                </div>
              </Modal>
            ) : !gameOver ? (
              <Modal
                layout
                variants={modalAnimationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={e => e.stopPropagation()}
              >
                <h1>Choose a powerup!</h1>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignContent: 'center',
                    position: 'absolute',
                    top: '50%',
                    transform: 'translate(0, -50%)',
                  }}
                >
                  <PowerUpOfferingRow>
                    {offeredPowerUps.map(e => (
                      <PowerUpOffering
                        key={`powerups-${e.name}`}
                        onClick={() => {
                          evaluatePowerUp(e.name);
                          setPause(false);
                          setModalOpen(false);
                          reset();
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 1 }}
                      >
                        <h2 style={{ width: '100%' }}>{e.name.toUpperCase()}</h2>
                        <p>{e.description}</p>
                      </PowerUpOffering>
                    ))}
                  </PowerUpOfferingRow>
                </div>
              </Modal>
            ) : (
              <Modal
                layout
                variants={modalAnimationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={e => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <h1>GAME OVER</h1>
                <h1>Final Score: {score}</h1>
                <Restart
                  whileHover={{ borderColor: '#4ed3a6', backgroundColor: '#7fffd4', scale: 1.05 }}
                  onClick={() => restartGame()}
                >
                  <h1>Restart</h1>
                </Restart>
              </Modal>
            )}
          </ModalBackdrop>
        )}
      </AnimatePresence>
    </GameScreen>
  );
}
