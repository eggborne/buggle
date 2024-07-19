import React, { ReactNode } from 'react';
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
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
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