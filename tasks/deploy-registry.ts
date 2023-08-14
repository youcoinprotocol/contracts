import { task, types } from "hardhat/config";
import { saveDeployedContracts, getDeployedContracts } from "../scripts/utils";

task("deploy:registry", "Deploy a YOURegistry contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, { ethers, hardhatArguments }): Promise<any> => {
    const RegistryFactory = await ethers.getContractFactory("YOURegistry");

    const registry = await RegistryFactory.deploy();

    await registry.deployed();

    if (logs) {
      console.info(
        `YOURegistry contract has been deployed to: ${registry.address}`
      );
    }

    saveDeployedContracts(hardhatArguments.network, {
      ...getDeployedContracts(hardhatArguments.network),
      Registry: registry.address,
    });

    return {
      registry,
    };
  });
