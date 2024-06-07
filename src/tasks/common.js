const {scope} = require("hardhat/config");
const enquirer = require("enquirer");
const scope_ = scope("cantrips", "Many generators and quick helpers");


async function inputUntil(initial, prompt, test, errorMessage) {
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
    cantripsScope: scope_,
    inputUntil
}