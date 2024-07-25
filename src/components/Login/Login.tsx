import { useEffect } from 'react';
import { GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../scripts/firebase';
import * as firebaseui from 'firebaseui'; // Import everything as firebaseui
import 'firebaseui/dist/firebaseui.css';
import { useUser } from '../../context/UserContext';

const Login = () => {
  const { setUser, setIsLoggedIn } = useUser();
  useEffect(() => {
    const uiConfig = {
      signInOptions: [
        GoogleAuthProvider.PROVIDER_ID,
      ],
      signInFlow: 'popup',
      callbacks: {
        signInSuccessWithAuthResult: (authResult: any) => {
          setUser(authResult.user);
          setIsLoggedIn(true);
          return false; // Avoid redirects after sign-in
        },
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
