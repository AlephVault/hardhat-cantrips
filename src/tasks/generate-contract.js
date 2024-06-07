const {applyTemplate} = require("../utils/templates");
const enquirer = require("enquirer");
const path = require("path");
const {cantripsScope, inputUntil} = require("./common");


cantripsScope.task("show-config")
    .setAction(({}, hre, runSuper) => {
        console.log("Config: ", hre.config);
        console.log("Solidity: ", hre.config.solidity.compilers);
    });


function getGreatestSolidityVersion(hre, compilerVersions) {
    if (compilerVersions.length === 0) throw new Error(
        "The current Hardhat configuration has no valid compiler entries. " +
        "Define at least one Solidity compiler entry (with proper version format)."
    );

    return compilerVersions.reduce((v1, v2) => {
        const v1parts = v1.split(".");
        const v2parts = v2.split(".");

        if (parseInt(v1parts[0]) > parseInt(v2parts[0])) return v1;
        if (parseInt(v1parts[1]) > parseInt(v2parts[1])) return v1;
        if (parseInt(v1parts[2]) > parseInt(v2parts[2])) return v1;
        return v2;
    });
}


async function selectSolidityVersion(hre) {
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

    let selectConfig = {
        name: "contractType",
        message: "Select one of the installed Solidity versions:",
        choices: compilerVersions.map((version) => {
            return {name: version, message: version}
        })
    };
    try {
        selectConfig.initial = await getGreatestSolidityVersion(hre, compilerVersions);
    } catch(e) {}

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
]


async function selectContractType(contractType) {
    contractType = (contractType || "").trim();
    if (contractType && !OPTIONS.find((e) => e.name === contractType))
    {
        console.error(`You've chosen a contract type not (yet) supported: ${contractType}`);
        contractType = "";
    }

    if (!contractType) {
        let prompt = new enquirer.Select({
            name: "contractType",
            message: "Select a contract type:",
            choices: OPTIONS
        });
        contractType = (await prompt.run());
    }

    return contractType;
}


function inputContractName(contractType) {
    return inputUntil(contractType, "Give a name to your contract:", (contractName) => {
        return /[A-Za-z][A-Za-z0-9]*/.test(contractName);
    }, "Invalid contract name");
}


cantripsScope.task("generate-contract")
    .setAction(async ({}, hre, runSuper) => {
        try {
            const contractsPath = hre.config.paths.sources;
            const contractType = await selectContractType();
            const contractName = await inputContractName(contractType);
            const solidityVersion = await selectSolidityVersion(hre);
            const sourceTemplate = `contracts/${contractType}.sol.template`;
            const targetPath = path.resolve(contractsPath, `${contractName}.sol`);
            const replacements = {
                SOLIDITY_VERSION: solidityVersion,
                CONTRACT_NAME: contractName
            }
            applyTemplate(sourceTemplate, replacements, targetPath);
            console.log(`Contract ${targetPath} successfully created`)
        } catch(e) {
            console.error(e);
        }
    });
