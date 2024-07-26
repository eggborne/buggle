import { useEffect } from 'react';
import { GithubAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../scripts/firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

const Login = () => {
  useEffect(() => {
    const uiConfig = {
      signInOptions: [
        GoogleAuthProvider.PROVIDER_ID,
        GithubAuthProvider.PROVIDER_ID,
      ],
      signInFlow: 'popup',
      callbacks: {
        signInSuccessWithAuthResult: () => false,
      },
    };

    const ui = new firebaseui.auth.AuthUI(auth);
    ui.start('#firebaseui-auth-container', uiConfig);
    return () => {
      ui.delete();
    };
  }, []);

  return <div id="firebaseui-auth-container"></div>;
};

export default Login;
