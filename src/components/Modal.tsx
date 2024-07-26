import { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

interface ModalProps {
  children?: ReactNode;
  isOpen: boolean;
  noCloseButton?: boolean;
  style?: Record<string, string | number>;
  onClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({ children, isOpen, noCloseButton, style, onClose }) => {
  return ReactDOM.createPortal(
    <div className={`modal-overlay ${isOpen ? 'showing' : 'hidden'}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={style}>
        {!noCloseButton && <button className="x-close" onClick={onClose}>
          &times;
        </button>}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;