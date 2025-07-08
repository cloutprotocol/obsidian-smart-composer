import { createContext, useContext, useState, ReactNode } from 'react';
import Modal from '../components/common/Modal'; // Adjust path as needed

type DialogComponent = React.FC<{
  onClose: () => void;
  [key: string]: any;
}>;

type DialogInstance = {
  id: number;
  Component: DialogComponent;
  props: any;
};

type DialogContextType = {
  openDialog: (Component: DialogComponent, props?: any) => void;
  closeDialog: (id: number) => void;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

let dialogId = 0;

export const DialogContainerProvider = ({ children }: { children: ReactNode }) => {
  const [dialogs, setDialogs] = useState<DialogInstance[]>([]);

  const openDialog = (Component: DialogComponent, props = {}) => {
    const id = dialogId++;
    setDialogs(prevDialogs => [...prevDialogs, { id, Component, props }]);
  };

  const closeDialog = (id: number) => {
    setDialogs(prevDialogs => prevDialogs.filter(dialog => dialog.id !== id));
  };

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      {dialogs.map(({ id, Component, props }) => (
        <Modal
          key={id}
          isOpen={true}
          onClose={() => closeDialog(id)}
          title={props.title || 'Dialog'}
        >
          <Component {...props} onClose={() => closeDialog(id)} />
        </Modal>
      ))}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogContainerProvider');
  }
  return context;
};
