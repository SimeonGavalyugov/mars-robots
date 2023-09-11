var fs = require("fs"),
  readline = require("readline"),
  { once } = require("events"),
  { EOL } = require("os");

type Orientation = "N" | "E" | "S" | "W";

type GridCoordinates = {
  x: number;
  y: number;
};

type Robot = {
  position: RobotPosition;
  instructions: RobotInstruction[];
};

type RobotPosition = GridCoordinates & {
  orientation: Orientation;
};

type RobotInstruction = "L" | "R" | "F";

const ORIENTATIONS: Orientation[] = ["N", "E", "S", "W"];

export const run = async () => {
  let gridBoundaries: GridCoordinates | undefined = undefined;
  let robotPositions: RobotPosition[] = [];
  let robotInstructions: RobotInstruction[][] = [];

  const readlineInterface = readline.createInterface({
    input: fs.createReadStream("./input.txt"),
  });

  readlineInterface.on("line", async (lineInput: string) => {
    const GRID_BOUNDARIES_REGEX = /^(\d) (\d)$/;
    const ROBOT_START_POSITION_REGEX = /^(\d) (\d) ([N|E|S|W]+)$/;
    const ROBOT_INSTRUCTIONS_REGEX = /^([F|L|R]+)$/;
    const line = lineInput.trim();

    if (GRID_BOUNDARIES_REGEX.test(line)) {
      const boundaries = line.split(" ");

      gridBoundaries = {
        x: parseInt(boundaries[0]),
        y: parseInt(boundaries[1]),
      };
    } else if (ROBOT_START_POSITION_REGEX.test(line)) {
      const robotPositionInstruction = line.split(" ");

      robotPositions.push({
        x: parseInt(robotPositionInstruction[0]),
        y: parseInt(robotPositionInstruction[1]),
        orientation: robotPositionInstruction[2] as Orientation,
      });
    } else if (ROBOT_INSTRUCTIONS_REGEX.test(line)) {
      robotInstructions.push(line.split("") as RobotInstruction[]);
    } else if (line.trim().length > 0) {
      readlineInterface.close();
      throw new Error(`Invalid input line - ${line}`);
    }
  });

  // Wait until all lines are processed
  await once(readlineInterface, "close");

  if (!gridBoundaries) {
    throw new Error("Invalid grid boundaries");
  }

  if (robotPositions.length === 0) {
    throw new Error("Invalid robot positions");
  }

  if (robotPositions.length !== robotInstructions.length) {
    throw new Error(
      "Each robot should have a position and instructions defined in sequence",
    );
  }

  const writeStream = fs.createWriteStream("./output.txt", {
    encoding: "utf8",
  });

  const result = moveRobots(
    gridBoundaries,
    robotPositions.map((position, index) => ({
      position,
      instructions: robotInstructions[index],
    })),
  );

  result.forEach((res) => writeStream.write(`${res}${EOL}`));
  return result;
};

// Helpers

const moveRobots = (topRightBoundary: GridCoordinates, robots: Robot[]) => {
  let finalPositions: string[] = [];
  let positionsRobotLostAt: RobotPosition[] = [];

  robots.forEach((robot) => {
    let robotPosition = robot.position;
    let lost = false;

    robot.instructions.forEach((instruction) => {
      if (lost) {
        return;
      }

      switch (instruction) {
        case "L":
          robotPosition = turnLeft(robotPosition);
          break;

        case "R":
          robotPosition = turnRight(robotPosition);
          break;

        case "F":
          if (hasRobotBeenLostAt(positionsRobotLostAt, robotPosition)) {
            break;
          }

          const newPosition = moveForward(robotPosition);
          if (outOfBounds(newPosition, topRightBoundary)) {
            lost = true;
            positionsRobotLostAt.push({
              x: robotPosition.x,
              y: robotPosition.y,
              orientation: robotPosition.orientation,
            });

            break;
          }

          robotPosition = newPosition;
          break;
      }
    });

    finalPositions.push(
      `${robotPosition.x} ${robotPosition.y} ${robotPosition.orientation}${
        lost ? " LOST" : ""
      }`,
    );
  });

  return finalPositions;
};

function turnLeft(robotPosition: RobotPosition): RobotPosition {
  const currentOrientationIndex = ORIENTATIONS.indexOf(
    robotPosition.orientation,
  );

  return {
    ...robotPosition,
    orientation:
      ORIENTATIONS[
        currentOrientationIndex === 0
          ? ORIENTATIONS.length - 1
          : currentOrientationIndex - 1
      ],
  };
}

function turnRight(robotPosition: RobotPosition): RobotPosition {
  const currentOrientationIndex = ORIENTATIONS.indexOf(
    robotPosition.orientation,
  );

  return {
    ...robotPosition,
    orientation:
      ORIENTATIONS[
        currentOrientationIndex === ORIENTATIONS.length - 1
          ? 0
          : currentOrientationIndex + 1
      ],
  };
}

function moveForward(robotPosition: RobotPosition): RobotPosition {
  switch (robotPosition.orientation) {
    case "N":
      return { ...robotPosition, y: robotPosition.y + 1 };
    case "E":
      return { ...robotPosition, x: robotPosition.x + 1 };
    case "S":
      return { ...robotPosition, y: robotPosition.y - 1 };
    case "W":
      return { ...robotPosition, x: robotPosition.x - 1 };
  }
}

function outOfBounds(
  robotPosition: RobotPosition,
  topRightBoundary: GridCoordinates,
) {
  return (
    robotPosition.x > topRightBoundary.x ||
    robotPosition.x < 0 ||
    robotPosition.y > topRightBoundary.y ||
    robotPosition.y < 0
  );
}

function hasRobotBeenLostAt(
  positionsRobotLostAt: RobotPosition[],
  currentPosition: RobotPosition,
) {
  return positionsRobotLostAt.some(
    (position) =>
      position.x === currentPosition.x &&
      position.y === currentPosition.y &&
      position.orientation === currentPosition.orientation,
  );
}
