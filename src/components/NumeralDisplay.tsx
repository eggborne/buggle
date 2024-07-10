import styles from './NumeralDisplay.module.css';


interface NumeralDisplayProps {
  digits: number;
  length?: number;
}

function NumeralDisplay({ digits, length = 4 }: NumeralDisplayProps) {
  if (!digits) {
    digits = 0;
  }
  const digitArray = digits.toString().padStart(length, '0').split('').map(digit => parseInt(digit));

  return (
    <div className={styles.numeralDisplay}>
      {digitArray.map((digit, d) =>
        <div
          className={styles.numeralDigit}
          key={d}
          style={{
            backgroundPositionY: `calc(var(--numeral-height) * ${digit} * -1)`
          }}
        ></div>)
      }
    </div>
  )
}

export default NumeralDisplay;