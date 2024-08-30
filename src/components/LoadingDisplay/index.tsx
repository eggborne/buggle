import './LoadingDisplay.css';

interface LoadingDisplayProps {
  style?: Record<string, string | number>;
}
const LoadingDisplay = ({ style }: LoadingDisplayProps) => {
  return (
    <div className="loading-display" style={style}>
      <div className="spinner">
        <div className="bounce1"></div>
        <div className="bounce2"></div>
        <div className="bounce3"></div>
      </div>
    </div>
  );
};

export default LoadingDisplay;
