import { useEffect } from 'react';
import { GithubAuthProvider, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { auth } from '../../scripts/firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { useUser } from '../../context/UserContext';
import { UserData } from 'types/types';

const Login = () => {
  const { setUser, setIsLoggedIn } = useUser();
  useEffect(() => {
    const uiConfig = {
      signInOptions: [
        GoogleAuthProvider.PROVIDER_ID,
        GithubAuthProvider.PROVIDER_ID,
      ],
      signInFlow: 'popup',
      callbacks: {
        signInSuccessWithAuthResult: (authResult: UserCredential) => {
          console.log('authresult', authResult);
          const { displayName, photoURL, uid } = authResult.user;
          const convertedName = displayName ? displayName.split(' ')[0] : 'Guest';
          const userData: UserData = {
            displayName: convertedName,
            photoURL,
            uid,
            phase: 'title'
          };
          setIsLoggedIn(true);
          setUser(userData);
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
