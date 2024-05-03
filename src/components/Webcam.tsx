import React from "react";
import * as faceapi from 'face-api.js';

// Webcam Props definition
export type WebcamProps = {
  videoWidth: number,
  videoHeight: number
};

type WebcamState = {
  modelsLoaded: boolean,
  captureVideo: boolean,
  box: {x: number, y: number, width: number, height: number}
};

/**
 * @description React Typescript Webcam Component
 * @author Mark Jess Anthony Enfermo
 */
export class Webcam extends React.Component<WebcamProps, WebcamState> {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;

  /*
    Happens before component is mounted.
  */
  constructor(props: WebcamProps) {
    super(props);

    // initialize props
    this.state = {
      modelsLoaded: false,
      captureVideo: false,
      box: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    };

    // initializing refs
    this.videoRef = React.createRef<HTMLVideoElement>();
    this.canvasRef = React.createRef<HTMLCanvasElement>();

    //binds
    this.startVideo = this.startVideo.bind(this);
    this.handleVideoOnPlay = this.handleVideoOnPlay.bind(this);
    this.closeWebcam = this.closeWebcam.bind(this);
  }

  /*
    Whenever component loads, the models are also loaded.
  */
  componentDidMount() {
    const loadModels = async () => {
      const MODEL_URL: string = process.env.PUBLIC_URL + '/models';
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]).then(() => { this.setState((prev) => ({...prev, modelsLoaded: true})); });
    };

    loadModels();
  }

  startVideo() {
    this.setState((prev) => ({
      ...prev,
      captureVideo: true
    }));

    navigator.mediaDevices
      .getUserMedia({video: {width: 300} })
      .then(stream => {
        let video = this.videoRef.current;

        if(video) {
          video.srcObject = stream;
        }

        video?.play();
      })
      .catch(err => {
        console.log(err);
      });
  }

  handleVideoOnPlay() {
    setInterval(async () => {
      // if one of the them are null, then return
      if(!this.canvasRef || 
          !this.canvasRef.current ||
          !this.videoRef ||
          !this.videoRef.current
        ) {
        return;
      }

      const canvas: HTMLCanvasElement = faceapi.createCanvasFromMedia(this.videoRef.current);
      this.canvasRef.current.innerHTML = '';
      this.canvasRef.current.append(canvas);

      const displaySize = {
          width: this.props.videoWidth,
          height: this.props.videoHeight
      };

      faceapi.matchDimensions(this.canvasRef.current, displaySize);

      const detections = await faceapi.detectAllFaces(this.videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      if(this.canvasRef && this.canvasRef.current) {
        this.canvasRef.current.getContext('2d')?.clearRect(0, 0, displaySize.width, displaySize.height);
        faceapi.draw.drawDetections(this.canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(this.canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceExpressions(this.canvasRef.current, resizedDetections);
      }
    }, 100);
  }

  closeWebcam() {
    this.videoRef.current?.pause();
    this.setState((prev) => ({
      ...prev,
      captureVideo: false
    }));
  }

  /*
    Actual HTML
  */
  render(): React.ReactNode {
    return (
    <div>
      <div style={{ textAlign: 'center', padding: '10px'}}>
        {this.state.captureVideo && this.state.modelsLoaded ?
          <button onClick={this.closeWebcam}> Close Webcam </button> :
          <button onClick={this.startVideo}> Open Webcam </button>
        }
        {this.state.captureVideo ? this.state.modelsLoaded ?
          <div style={{display: 'flex', justifyContent: 'center', padding: '10px'}}>
            <video 
              ref={this.videoRef} 
              height={this.props.videoHeight} 
              width={this.props.videoWidth}
              onPlay={this.handleVideoOnPlay}
              style={{borderRadius: '10px'}}
            />
            <canvas
              ref={this.canvasRef}
              style={{position: 'absolute'}}
            />
          </div> 
          :
          <div> Loading </div>
          :
          <div> </div>
        }
      </div>
    </div>);
  }
}
