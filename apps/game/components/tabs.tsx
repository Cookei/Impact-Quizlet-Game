import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const Tab = styled(motion.button)<{ $selected }>`
  min-width: 100px;
  height: 50px;
  background-color: ${props => (props.$selected ? '#7fffd4' : '#4ed3a6')};
  border: hidden;
  border-radius: 5px;
  margin: 10px;
  border-bottom: solid;
  border-width: 5px;
  border-color: ${props => (props.$selected ? '#4ed3a6' : '#95d8c2')};
  box-shadow: 5px 5px black;
`;

const SetTab = styled(motion.button)`
  min-width: 100px;
  height: 50px;
  background-color: #4ed3a6;
  border: none;
  border-bottom: solid;
  border-radius: 5px;
  border-color: #95d8c2;
  border-width: 5px;
  box-shadow: 5px 5px #3b3b3b;
  margin: 10px;
`;

const Tabs = ({ tabs, callback }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabsArray = [];
  for (let e of tabs) {
    const contentArray = [];
    for (let i in e.content) {
      if (e.content.hasOwnProperty(i)) {
        contentArray.push(e.content[i]);
      }
    }
    tabsArray.push({
      title: e.title,
      id: e.id,
      content: contentArray,
    });
  }

  return (
    <div style={{ width: '100%' }}>
      <ul
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignContent: 'space-evenly',
          padding: 0,
          borderBottom: 'solid',
          borderWidth: '2px',
          borderColor: '#00000083',
        }}
      >
        {tabsArray.map((e, i) => (
          <Tab
            onClick={() => setSelectedTab(i)}
            id={`tabsArray-${i}`}
            key={e.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 1 }}
            $selected={selectedTab == i ? true : false}
          >
            {e.title}
          </Tab>
        ))}
      </ul>
      <div>
        <ul>
          {tabsArray[selectedTab].content.map((e, i) => (
            <SetTab
              id={`tabContent-${e.set.id}`}
              key={`tabContent-${i}-${e.set.id}`}
              onClick={() => callback(e)}
              whileHover={{ scale: 1.1, backgroundColor: '#a3ffe0', borderColor: '#4ed3a6' }}
              whileTap={{ scale: 1 }}
            >
              {e.set.title}
            </SetTab>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Tabs;
