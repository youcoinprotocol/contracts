import { hardhatArguments, run } from "hardhat"
import { getDeployedContracts } from "./utils"

async function verify(address: string, constructorArguments?: any[]): Promise<void> {
    try {
        await run("verify:verify", {
            address,
            constructorArguments
        })
    } catch (error) {
        console.error(error)
    }
}

async function main() {
    const deployedContracts = getDeployedContracts(hardhatArguments.network)

    if (deployedContracts) {
        await verify(deployedContracts.IncrementalBinaryTree)
        await verify(deployedContracts.Pairing)
        await verify(deployedContracts.SemaphoreVerifier)
        await verify(deployedContracts.Semaphore, [deployedContracts.SemaphoreVerifier, deployedContracts.Registry])
        await verify(deployedContracts.Registry)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
