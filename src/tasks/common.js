const {scope} = require("hardhat/config");
const enquirer = require("enquirer");
const scope_ = scope("cantrips", "Many generators and quick helpers");
const {inputUntil} = require("../utils/input");


module.exports = {
    cantripsScope: scope_,
    inputUntil
}