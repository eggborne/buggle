import styles from './NumeralDisplay.module.css';


interface NumeralDisplayProps {
  color?: string;
  digits: number;
  length?: number;
  height?: string;
  throbbing? : boolean;
}

function NumeralDisplay({ color = 'white', digits, length = 4, height = '1.5rem', throbbing }: NumeralDisplayProps) {
  if (!digits) {
    digits = 0;
  }
  const digitArray = digits.toString().padStart(length, '0').split('').map(digit => parseInt(digit));

  return (
    <div className={`${styles.numeralDisplay} ${throbbing ? styles.throbbing : ''} `} style={{ '--numeral-height': height } as React.CSSProperties}>
      {digitArray.map((digit, d) =>
        <div
          className={`${styles.numeralDigit} ${styles[color]}`}
          key={d}
          style={{
            backgroundPositionY: `calc(var(--numeral-height) * ${digit} * -1)`,
          }}
        ></div>)
      }
    </div>
  )
}

export default NumeralDisplay;