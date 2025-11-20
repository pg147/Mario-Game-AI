export const TILE_SIZE = 16;
export const SCALE = 3; // Visual scaling
export const SCREEN_WIDTH = 256; // Internal resolution width
export const SCREEN_HEIGHT = 240; // Internal resolution height

export const GRAVITY = 0.22;
export const MAX_FALL_SPEED = 4.0;
export const JUMP_FORCE = -6.0;
export const ACCELERATION = 0.08;
export const FRICTION = 0.9;
export const MAX_SPEED = 1.6;

// Entity Types
export enum EntityType {
  PLAYER = 'PLAYER',
  GOOMBA = 'GOOMBA',
  PARTICLE = 'PARTICLE',
  FLOATING_TEXT = 'FLOATING_TEXT'
}

// Tile Types
export enum TileType {
  EMPTY = 0,
  GROUND = 1,
  BRICK = 2,
  QUESTION = 3,
  PIPE_L = 4, // Pipe Left
  PIPE_R = 5, // Pipe Right
  PIPE_TL = 6, // Pipe Top Left
  PIPE_TR = 7, // Pipe Top Right
  BLOCK = 8, // Hard block
  USED = 9, // Used block
  FLAG_POLE = 10,
  FLAG_TOP = 11,
}

export const COLORS = {
  sky: '#5C94FC',
  ground: '#C84C0C', // Burnt orange/brown
  brick: '#B83800',
  pipe: '#00A800',
  goomba: '#BC4D00',
};