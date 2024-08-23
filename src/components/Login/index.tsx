import styles from './Login.module.css';
import googleIcon from '/assets/google-icon.svg';
import githubIcon from '/assets/github-icon.svg';
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { auth } from '../../scripts/firebase';

const Login = () => {
  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        // Handle successful login
        console.log('Google login success:', result);
      })
      .catch((error) => {
        // Handle Errors here.
        console.error('Google login error:', error);
      });
  };

  const handleGithubLogin = () => {
    const provider = new GithubAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        // Handle successful login
        console.log('GitHub login success:', result);
      })
      .catch((error) => {
        // Handle Errors here.
        console.error('GitHub login error:', error);
      });
  };

  return (
    <div>
      <button className={`${styles.loginButton} ${styles.googleButton}`} onClick={handleGoogleLogin}>
        <img src={googleIcon} alt="Google Icon" /> Login with Google
      </button>
      <button className={`${styles.loginButton} ${styles.githubButton}`} onClick={handleGithubLogin}>
        <img src={githubIcon} alt="GitHub Icon" /> Login with GitHub
      </button>
    </div>
  );
};

export default Login;
