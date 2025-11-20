import { EntityType, TileType } from "./constants";

export interface Vector2 {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GameState {
  score: number;
  lives: number;
  coins: number;
  time: number;
  world: string;
  isGameOver: boolean;
  isLevelComplete: boolean;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  vel: Vector2;
  size: Vector2;
  dead: boolean;
  update: (dt: number, level: LevelMap) => void;
  draw: (ctx: CanvasRenderingContext2D, camera: Vector2) => void;
  onCollide?: (other: Entity) => void;
}

export interface LevelMap {
  width: number;
  height: number;
  tiles: TileType[][];
  entities: Entity[];
}

export type AILevelData = string[]; // Array of strings representing rows