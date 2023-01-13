type Value = number | boolean | ((...params: Value[]) => Value);

type Scope = Record<string, Value>;

type Expression =
  | Literal
  | GetVariable
  | Func
  | Call
  | NewVariable
  | BinOp
  | If;

class Literal {
  constructor(private value: number) {}

  eval(_: Scope): Value {
    return this.value;
  }
}

class GetVariable {
  constructor(private name: string) {}

  eval(scope: Scope): Value {
    return scope[this.name];
  }
}

class Func {
  public callable = true;
  constructor(public body: Expression[], private paramNames: string[]) {}

  eval(scope: Scope): Value {
    return (...params: Value[]) => {
      const funScope: Scope = {};
      this.paramNames.forEach((n, i) => (funScope[n] = params[i]));
      const vals = this.body.map((e) => e.eval({ ...scope, ...funScope }));
      return vals[vals.length - 1];
    };
  }
}

class Call {
  constructor(private expr: Expression, private params: Expression[]) {}

  eval(scope: Scope): Value {
    const maybeFunc = this.expr.eval(scope);
    if (typeof maybeFunc === "number" || typeof maybeFunc === "boolean") {
      throw new Error("Cannot call number or boolean");
    }
    const paramValues = this.params.map((e) => e.eval(scope));
    return maybeFunc(...paramValues);
  }
}

class NewVariable {
  constructor(private name: string, private expr: Expression) {}

  eval(scope: Scope): Value {
    const val = this.expr.eval(scope);
    scope[this.name] = val;
    return val;
  }
}

class If {
  constructor(private condition: Expression, private trueExpr: Expression) {}

  eval(scope: Scope): Value {
    if (this.condition.eval(scope)) {
      return this.trueExpr.eval(scope);
    }
    // complete hack to make fibonnacci work lol
    return 1;
  }
}

class BinOp {
  constructor(
    private op: "+" | "-" | ">",
    private leftExpr: Expression,
    private rightExpr: Expression
  ) {}

  eval(scope: Scope): Value {
    const leftVal = this.leftExpr.eval(scope);
    const rightVal = this.rightExpr.eval(scope);
    if (typeof leftVal !== "number" || typeof rightVal !== "number") {
      throw new Error("Cannot perform binary op on functions");
    }
    switch (this.op) {
      case "+":
        return leftVal + rightVal;
      case "-":
        return leftVal - rightVal;
      case ">":
        return leftVal > rightVal;
    }
  }
}

// Test(s)
const fibbonacci = [
  new NewVariable(
    "fib",
    new Func(
      [
        new If(
          new BinOp(">", new GetVariable("n"), new Literal(1)),
          new BinOp(
            "+",
            new Call(new GetVariable("fib"), [
              new BinOp("-", new GetVariable("n"), new Literal(1)),
            ]),
            new Call(new GetVariable("fib"), [
              new BinOp("-", new GetVariable("n"), new Literal(2)),
            ])
          )
        ),
      ],
      ["n"]
    )
  ),
  new Call(new GetVariable("fib"), [new Literal(10)]),
];

const globalScope = {};
console.log(
  "fibonnaci(10) returns:",
  fibbonacci.map((e) => e.eval(globalScope))[1]
);
