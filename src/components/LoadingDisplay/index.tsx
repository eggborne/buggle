import './LoadingDisplay.css';

const LoadingDisplay= () => {
  return (
    <div className="loading-display">
      <div className="spinner">
        <div className="bounce1"></div>
        <div className="bounce2"></div>
        <div className="bounce3"></div>
      </div>
    </div>
  );
};

export default LoadingDisplay;
