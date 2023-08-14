import { poseidon_gencontract as poseidonContract } from "circomlibjs";
import { task, types } from "hardhat/config";
import { saveDeployedContracts, getDeployedContracts } from "../scripts/utils";
import { Signer } from "@ethersproject/abstract-signer";

task("deploy:semaphore", "Deploy a Semaphore contract")
  .addOptionalParam<boolean>(
    "pairing",
    "Pairing library address",
    undefined,
    types.string
  )
  .addOptionalParam<boolean>(
    "semaphoreverifier",
    "SemaphoreVerifier contract address",
    undefined,
    types.string
  )
  .addOptionalParam<boolean>(
    "poseidon",
    "Poseidon library address",
    undefined,
    types.string
  )
  .addOptionalParam<boolean>(
    "registry",
    "YOURegistry address",
    undefined,
    types.string
  )
  .addOptionalParam<boolean>(
    "incrementalbinarytree",
    "IncrementalBinaryTree library address",
    undefined,
    types.string
  )
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .setAction(
    async (
      {
        logs,
        pairing: pairingAddress,
        semaphoreverifier: semaphoreVerifierAddress,
        poseidon: poseidonAddress,
        incrementalbinarytree: incrementalBinaryTreeAddress,
        registry: registryAddress,
      },
      { ethers, hardhatArguments }
    ): Promise<any> => {
      if (!semaphoreVerifierAddress) {
        if (!pairingAddress) {
          const PairingFactory = await ethers.getContractFactory("Pairing");
          const pairing = await PairingFactory.deploy();

          await pairing.deployed();

          if (logs) {
            console.info(
              `Pairing library has been deployed to: ${pairing.address}`
            );
          }

          pairingAddress = pairing.address;
        }

        const SemaphoreVerifierFactory = await ethers.getContractFactory(
          "SemaphoreVerifier",
          {
            libraries: {
              Pairing: pairingAddress,
            },
          }
        );

        const semaphoreVerifier = await SemaphoreVerifierFactory.deploy();

        await semaphoreVerifier.deployed();

        if (logs) {
          console.info(
            `SemaphoreVerifier contract has been deployed to: ${semaphoreVerifier.address}`
          );
        }

        semaphoreVerifierAddress = semaphoreVerifier.address;
      }

      if (!incrementalBinaryTreeAddress) {
        if (!poseidonAddress) {
          const poseidonABI = poseidonContract.generateABI(2);
          const poseidonBytecode = poseidonContract.createCode(2);

          const [signer] = await ethers.getSigners();

          const PoseidonFactory = new ethers.ContractFactory(
            poseidonABI,
            poseidonBytecode,
            signer
          );
          const poseidon = await PoseidonFactory.deploy();

          await poseidon.deployed();

          if (logs) {
            console.info(
              `Poseidon library has been deployed to: ${poseidon.address}`
            );
          }

          poseidonAddress = poseidon.address;
        }

        const IncrementalBinaryTreeFactory = await ethers.getContractFactory(
          "IncrementalBinaryTree",
          {
            libraries: {
              PoseidonT3: poseidonAddress,
            },
          }
        );
        const incrementalBinaryTree =
          await IncrementalBinaryTreeFactory.deploy();

        await incrementalBinaryTree.deployed();

        if (logs) {
          console.info(
            `IncrementalBinaryTree library has been deployed to: ${incrementalBinaryTree.address}`
          );
        }

        incrementalBinaryTreeAddress = incrementalBinaryTree.address;
      }

      const SemaphoreFactory = await ethers.getContractFactory("Semaphore", {
        libraries: {
          IncrementalBinaryTree: incrementalBinaryTreeAddress,
        },
      });

      const accounts: Signer[] = await ethers.getSigners();

      const semaphore = await SemaphoreFactory.deploy(
        semaphoreVerifierAddress,
        registryAddress ?? accounts[0].getAddress()
      );

      await semaphore.deployed();

      if (logs) {
        console.info(
          `Semaphore contract has been deployed to: ${semaphore.address}`
        );
      }

      saveDeployedContracts(hardhatArguments.network, {
        ...getDeployedContracts(hardhatArguments.network),
        Pairing: pairingAddress,
        SemaphoreVerifier: semaphoreVerifierAddress,
        Poseidon: poseidonAddress,
        IncrementalBinaryTree: incrementalBinaryTreeAddress,
        Semaphore: semaphore.address,
        Registry: registryAddress,
      });

      return {
        semaphore,
        pairingAddress,
        semaphoreVerifierAddress,
        poseidonAddress,
        incrementalBinaryTreeAddress,
      };
    }
  );
