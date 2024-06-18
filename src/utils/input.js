const enquirer = require("enquirer");
const {checkNotInteractive} = require("./common");


async function inputUntil(initial, prompt, test, errorMessage, forceNonInteractive) {
    checkNotInteractive(forceNonInteractive);

    while(true) {
        const contractName = await new enquirer.Input({
            message: prompt,
            initial: initial
        }).run();
        if (!test(contractName)) {
            console.error(errorMessage);
        } else {
            return contractName;
        }
    }
}


module.exports = {
    inputUntil
}