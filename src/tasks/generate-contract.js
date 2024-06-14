const {applyTemplate} = require("../utils/templates");
const enquirer = require("enquirer");
const path = require("path");
const {cantripsScope} = require("./common");
const {checkNotInteractive} = require("../utils/common");
const {inputUntil} = require("../utils/input");


/**
 * Selects a solidity version (or keeps the provided one if it is valid).
 * @param solidityVersion The initial (and perhaps to keep) solidity version.
 * If not valid, this command tries to become interactive and pick one of the
 * available solidity versions.
 * @param forceNonInteractive If true, raises an error when the command tries
 * to become interactive.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<*|string>} The chosen solidity version (async function).
 */
async function selectSolidityVersion(solidityVersion, forceNonInteractive, hre) {
    let compilerVersions = [];
    try {
        compilerVersions = hre.config.solidity.compilers.map((entry) => {
            return (entry.version || "").trim();
        }).filter((version) => {
            return /\d+\.\d+\.\d+/.test(version);
        });
    } catch(e) {
        throw new Error(
            "Your Hardhat config seems to not have the appropriate format " +
            "for the solidity compilers. Please ensure that section is properly " +
            "configured and try again."
        );
    }

    if (compilerVersions.length === 0) throw new Error(
        "The current Hardhat configuration has no valid compiler entries. " +
        "Define at least one Solidity compiler entry (with proper version format)."
    );

    const newest = compilerVersions.reduce((v1, v2) => {
        const v1parts = v1.split(".");
        const v2parts = v2.split(".");

        if (parseInt(v1parts[0]) > parseInt(v2parts[0])) return v1;
        if (parseInt(v1parts[1]) > parseInt(v2parts[1])) return v1;
        if (parseInt(v1parts[2]) > parseInt(v2parts[2])) return v1;
        return v2;
    });

    if (solidityVersion === "newest") {
        return newest;
    } else if (compilerVersions.indexOf(solidityVersion) >= 0) {
        return solidityVersion;
    }

    let selectConfig = {
        name: "solidityVersion",
        message: "Select one of the installed Solidity versions:",
        choices: compilerVersions.map((version) => {
            return {name: version, message: version}
        })
    };
    try {
        selectConfig.initial = newest;
    } catch(e) {}

    checkNotInteractive(forceNonInteractive);
    let prompt = new enquirer.Select(selectConfig);
    return await prompt.run();
}


/**
 * These are the only supported options in our generator.
 */
const OPTIONS = [
    {name: "ERC20", message: "A regular, OpenZeppelin-powered, ERC20 contract file"},
    {name: "OwnedERC20", message: "An owned, OpenZeppelin-powered, ERC20 contract file"},
    {name: "ERC721", message: "A regular, OpenZeppelin-powered, ERC721 contract file"},
    {name: "OwnedERC721", message: "An owned, OpenZeppelin-powered, ERC721 contract file"},
    {name: "ERC1155", message: "A regular, OpenZeppelin-powered, ERC1155 contract file"},
    {name: "OwnedERC1155", message: "An owned, OpenZeppelin-powered, ERC1155 contract file"},
    {name: "PriceFeed", message: "A ChainLink PriceFeed contract mock file"}
]


const PATHS = {
    ERC20: "contracts/ERC20",
    OwnedERC20: "contracts/OwnedERC20",
    ERC721: "contracts/ERC721",
    OwnedERC721: "contracts/OwnedERC721",
    ERC1155: "contracts/ERC1155",
    OwnedERC1155: "contracts/OwnedERC1155",
    PriceFeed: "contracts/chainlink/PriceFeed",
}


/**
 * Selects a type of contract to generate (or keeps the provided one if it is valid).
 * @param contractType The initial (and perhaps to keep) contract type. If not valid,
 * this command tries to become interactive and pick one of the available contract
 * types.
 * @param forceNonInteractive If true, raises an error when the command tries
 * to become interactive.
 * @returns {Promise<*|string>} The chosen contract type (async function).
 */
async function selectContractType(contractType, forceNonInteractive) {
    if (contractType && !OPTIONS.find((e) => e.name === contractType))
    {
        console.error(`You've chosen a contract type not (yet) supported: ${contractType}.`);
        contractType = "";
    }

    if (!contractType) {
        checkNotInteractive(forceNonInteractive);
        let prompt = new enquirer.Select({
            name: "contractType",
            message: "Select a contract type:",
            choices: OPTIONS
        });
        contractType = (await prompt.run());
    }

    return contractType;
}


/**
 * Validates the contract name to be a valid Solidity contract name.
 * @param contractName
 * @returns {*|string}
 */
function validateContractName(contractName) {
    return /^[A-Za-z][A-Za-z0-9_]*$/.test(contractName) ? contractName : ""
}


/**
 * Prompts the user to write a valid contract name.
 * @param contractType The contract type.
 * @param forceNonInteractive If true, raises an error since this command tries
 * to become interactive.
 * @returns {Promise<*|undefined>} The contract name (async function).
 */
function inputContractName(contractType, forceNonInteractive) {
    checkNotInteractive(forceNonInteractive);
    return inputUntil("My" + contractType, "Give a name to your contract:", (contractName) => {
        return /^[A-Za-z][A-Za-z0-9_]*$/.test(contractName);
    }, "Invalid contract name.");
}


cantripsScope.task("generate-contract", "Generates a contract file from a supported contract type")
    .addOptionalParam("contractType", "An optional, non-interactive, contract type")
    .addOptionalParam("contractName", "An optional contract name")
    .addOptionalParam("solidityVersion", "The solidity version to use (or 'newest' to pick the newest one from the config)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({ contractType, solidityVersion, contractName, forceNonInteractive }, hre, runSuper) => {
        try {
            contractType = (contractType || "").trim();
            contractName = (contractName || "").trim();
            solidityVersion = (solidityVersion || "").trim();
            const contractsPath = hre.config.paths.sources;
            const contractType_ = await selectContractType(contractType, forceNonInteractive);
            const contractName_ = validateContractName(contractName) || await inputContractName(contractType_, forceNonInteractive);
            const solidityVersion_ = await selectSolidityVersion(solidityVersion, forceNonInteractive, hre);
            const contractPath = PATHS[contractType_];
            const sourceTemplate = `${contractPath}.sol.template`;
            const targetPath = path.resolve(contractsPath, `${contractName_}.sol`);
            const replacements = {
                SOLIDITY_VERSION: solidityVersion_,
                CONTRACT_NAME: contractName_
            }
            applyTemplate(sourceTemplate, replacements, targetPath);
            console.log(`Contract ${targetPath} successfully created.`)
        } catch(e) {
            console.error(e);
        }
    });
