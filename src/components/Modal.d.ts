import { ReactNode } from 'react';
import './Modal.css';
interface ModalProps {
    children?: ReactNode;
    isOpen: boolean;
    noCloseButton?: boolean;
    style?: Record<string, string | number>;
    onClose?: () => void;
}
declare const Modal: React.FC<ModalProps>;
export default Modal;
