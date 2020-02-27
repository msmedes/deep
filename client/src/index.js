import React from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';

import App from './App/App';

const socket = io.connect('http://localhost:5000', {});

ReactDOM.render(
  <App socket={socket} />,
  document.getElementById('root'),
);
