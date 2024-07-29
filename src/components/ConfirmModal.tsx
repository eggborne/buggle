import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  style: Record<string, string | number>;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ isOpen, message, style, onConfirm, onCancel }: ConfirmModalProps) => {
  return (
    <Modal style={style} isOpen={isOpen} noCloseButton onClose={onCancel}>
      <h3>{message}</h3>
      <div className={'button-group row'}>
        <button onClick={onConfirm} className={'start'}>OK</button>
        <button onClick={onCancel} className={'cancel'}>No</button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;