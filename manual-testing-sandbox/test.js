class Calculator {
  constructor() {
    this.result = 0;
  }

  add(number) {
    this.result += number;
    return this;
  }
  
  subtract(number) {
    this.result -= number;
    return this;
  }

  multiply(number) {
    this.result *= number;
    return this;
  }

  divide(number) {
    if (number === 0) {
      throw new Error("Cannot divide by zero");
    }
    this.result /= number;
    return this;
  }

  power(number) {
    this.result = Math.pow(this.result, number);
    return this;
  }

  root(number) {
    if (number === 0) {
      throw new Error("Cannot calculate 0th root");
    }
    if (number % 2 === 0 && this.result < 0) {
      throw new Error("Cannot calculate even root of negative number");
    }
    this.result = Math.pow(this.result, 1 / number);
    return this;
  }

  getResult() {
    return this.result;
  }

  reset() {
    this.result = 0;
    return this;
  }
}
