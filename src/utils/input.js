const enquirer = require("enquirer");
const {checkNotInteractive} = require("./common");
const readline = require('readline');


/**
 * A "press any key to continue..." prompt.
 */
class AnyKeyPrompt extends enquirer.Prompt {
    constructor(message) {
        super();
        this.message = message;
    }

    async run() {
        console.log(this.message);
        return new Promise(resolve => {
            readline.emitKeypressEvents(process.stdin);
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('keypress', () => {
                process.stdin.setRawMode(false);
                resolve();
            });
        });
    }
}


/**
 * A "Press any key to continue..." input utility.
 * @param message The message.
 * @returns {Promise<void>} nothing (async function).
 */
async function inputPause(message) {
    await new AnyKeyPrompt(message).run();
}


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


async function givenOrInputUntil(given, initial, prompt, test, errorMessage, forceNonInteractive) {
    given ||= "";
    return test(given) ? given : await inputUntil(initial, prompt, test, errorMessage, forceNonInteractive);
}


module.exports = {
    inputUntil, givenOrInputUntil, inputPause
}