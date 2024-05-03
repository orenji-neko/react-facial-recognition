import React from 'react';
import { Webcam } from './components/Webcam';

class App extends React.Component {

  render(): React.ReactNode {
    return (
      <div>
        <Webcam videoWidth={640} videoHeight={480}/>
      </div>
    );
  }
}

export default App;
