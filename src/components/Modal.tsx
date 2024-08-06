import { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

interface ModalProps {
  children?: ReactNode;
  className?: string;
  isOpen: boolean;
  noCloseButton?: boolean;
  style?: Record<string, string | number>;
  onClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({ className = '', children, isOpen, noCloseButton, style, onClose }) => {
  return ReactDOM.createPortal(
    <div className={`modal-overlay ${isOpen ? 'showing' : 'hidden'}`} onClick={onClose}>
      <div className={`modal ${className}`} onClick={(e) => e.stopPropagation()} style={style}>
        {children}
      </div>
      {!noCloseButton && <button className="x-close" onClick={onClose}>
        &times;
      </button>}
    </div>,
    document.body
  );
};

export default Modal;