**Thanks for taking the time to contribute!**  
Please follow the rules below when making contributions to this project.

# Wanted and unwanted contributions
We appriciate all the help we can get, but we'd prefer it if you didnt submit issues/PRs if we consider them unwanted.

### Unwanted contributions
- Small nitpicky changes (spelling, grammar)
- Extremely breaking changes (overhauling layouts of integral files like config)
- **Changes to the way EXP is counted**

### Wanted contributions
Generally everything that doesn't fit in the unwanted category is wanted, for example:
- Bugfixes
- Feature additions

# Code style
We follow [Standard.js](https://standardjs.com/) as our base code style, but we have a few other additional rules too.

1. Chain promises where possible
    ```js
    // ✗ bad
    aPromise().then(result => {
      anotherPromise(result).then(anotherresult => {
        console.log(anotherresult)
      }).catch(console.error)
    }).catch(console.error)
    ```
    ```js
    // ✓ good
    aPromise().then(result => {
      return anotherPromise(result)
    }).then(anotherresult => {
      console.log(anotherresult)
    }).catch(console.error)
    ```
2. When calling the same code multiple times, make a helper function instead of reusing the same code, commonly reused functions should be added to commonutil.js
    ```js
    // ✓ good
    function doStuff() {
      doSomething.then(result => {
       return doSomethingElse(result)
      })
    }
    
    doStuff().then(console.log)
    ```
3. If a variable is unlikely to change, **and** can't be considered sensitive, add it as a constant to constants.js

