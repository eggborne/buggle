import styles from './NumeralDisplay.module.css';


interface NumeralDisplayProps {
  digits: number;
  length?: number;
  height?: string;
}

function NumeralDisplay({ digits, length = 4, height = '1.5rem' }: NumeralDisplayProps) {
  if (!digits) {
    digits = 0;
  }
  const digitArray = digits.toString().padStart(length, '0').split('').map(digit => parseInt(digit));

  return (
    <div className={styles.numeralDisplay} style={{ '--numeral-height': height } as React.CSSProperties}>
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