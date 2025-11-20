import {
  TILE_SIZE,
  GRAVITY,
  MAX_FALL_SPEED,
  JUMP_FORCE,
  ACCELERATION,
  FRICTION,
  MAX_SPEED,
  TileType,
  EntityType,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  COLORS
} from '../constants';
import { Entity, LevelMap, Vector2, Box, AILevelData } from '../types';
import { Renderer } from './Renderer';
import { Input } from './Input';

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private input: Input;
  private loopId: number = 0;

  private level!: LevelMap;
  private player!: Entity;
  private camera: Vector2 = { x: 0, y: 0 };

  public onScoreChange?: (score: number) => void;
  public onGameOver?: () => void;
  public onWin?: () => void;

  private score: number = 0;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.renderer = new Renderer(this.ctx);
    this.input = new Input();
  }

  public async loadLevel(levelData: AILevelData) {
    // Parse level
    const tiles: TileType[][] = [];
    const entities: Entity[] = [];
    let playerSpawn = { x: 50, y: 100 };

    levelData.forEach((row, y) => {
      const tileRow: TileType[] = [];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        if (char === '#') tileRow.push(TileType.GROUND);
        else if (char === 'B') tileRow.push(TileType.BRICK);
        else if (char === '?') tileRow.push(TileType.QUESTION);
        else if (char === 'T') tileRow.push(TileType.BLOCK);
        else if (char === 'P') tileRow.push(TileType.PIPE_L); // Simplification
        else if (char === 'F') tileRow.push(TileType.FLAG_POLE);
        else if (char === 'E') {
            tileRow.push(TileType.EMPTY);
            entities.push(this.createGoomba(x * TILE_SIZE, y * TILE_SIZE));
        } else {
            tileRow.push(TileType.EMPTY);
        }
      }
      tiles.push(tileRow);
    });

    this.level = {
      width: tiles[0].length * TILE_SIZE,
      height: tiles.length * TILE_SIZE,
      tiles,
      entities
    };

    this.player = this.createPlayer(playerSpawn.x, playerSpawn.y);
    this.camera = { x: 0, y: 0 };
    this.score = 0;
    this.isRunning = true;

    this.startLoop();
  }

  private createPlayer(x: number, y: number): Entity {
    return {
      id: 'player',
      type: EntityType.PLAYER,
      pos: { x, y },
      vel: { x: 0, y: 0 },
      size: { x: 12, y: 16 }, // Slightly smaller width for leniency
      dead: false,
      update: (dt, level) => this.updatePlayer(dt, level),
      draw: () => {}, // Handled by renderer
    };
  }

  private createGoomba(x: number, y: number): Entity {
    return {
      id: `goomba_${Math.random()}`,
      type: EntityType.GOOMBA,
      pos: { x, y },
      vel: { x: -0.5, y: 0 },
      size: { x: 16, y: 16 },
      dead: false,
      update: (dt, level) => this.updateGoomba(dt, level, this.level.entities.find(e => e.id.startsWith('goomba'))!), // Self ref
      draw: () => {}
    };
  }

  private startLoop() {
    let lastTime = performance.now();
    const loop = (time: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((time - lastTime) / 16.66, 2); // Cap dt
      lastTime = time;

      this.update(dt);
      this.draw();
      this.loopId = requestAnimationFrame(loop);
    };
    this.loopId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.loopId);
    this.input.cleanup();
  }

  private update(dt: number) {
    if (this.player.dead) return;

    // Update Player
    this.player.update(dt, this.level);
    this.checkEntityCollisions();

    // Update Entities
    this.level.entities.forEach(ent => {
        // Hack to pass self reference
        if (ent.type === EntityType.GOOMBA) this.updateGoomba(dt, this.level, ent);
    });

    // Cleanup dead entities
    this.level.entities = this.level.entities.filter(e => !e.dead || (e.type === EntityType.GOOMBA && e.dead && e.vel.y === 0));

    // Camera Follow
    // Keep player in middle 1/3 of screen, allowing bidirectional movement
    this.camera.x = this.player.pos.x - SCREEN_WIDTH * 0.4;
    
    // Clamp camera
    this.camera.x = Math.max(0, Math.min(this.camera.x, this.level.width - SCREEN_WIDTH));

    // Win Condition
    if (this.player.pos.x > this.level.width - 50) {
        this.onWin?.();
        this.isRunning = false;
    }

    // Death (Fall)
    if (this.player.pos.y > SCREEN_HEIGHT) {
        this.player.dead = true;
        this.onGameOver?.();
        this.isRunning = false;
    }
  }

  private updatePlayer(dt: number, level: LevelMap) {
    const p = this.player;

    // Input
    if (this.input.isDown('ArrowRight')) p.vel.x += ACCELERATION * dt;
    else if (this.input.isDown('ArrowLeft')) p.vel.x -= ACCELERATION * dt;
    else p.vel.x *= FRICTION; // Friction

    // Max Speed
    p.vel.x = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.vel.x));

    // Jump
    if ((this.input.isDown(' ') || this.input.isDown('ArrowUp')) && this.isOnGround(p)) {
        p.vel.y = JUMP_FORCE;
    }

    // Gravity
    p.vel.y += GRAVITY * dt;
    p.vel.y = Math.min(p.vel.y, MAX_FALL_SPEED);

    this.resolveMapCollision(p);
  }

  private updateGoomba(dt: number, level: LevelMap, entity: Entity) {
      if (entity.dead) return; // Don't move if squashed

      // Gravity
      entity.vel.y += GRAVITY * dt;
      entity.vel.y = Math.min(entity.vel.y, MAX_FALL_SPEED);

      // Move
      const prevX = entity.pos.x;
      this.resolveMapCollision(entity);

      // Check if hit wall (velocity X stopped)
      // Simple check: if we were moving and now stopped, flip direction
      // Note: resolveMapCollision modifies position, we need to check if x didn't change as expected
      // But a simpler way for AI is to check if it would collide
  }

  private isOnGround(ent: Entity): boolean {
      // Check directly below
      const y = Math.floor((ent.pos.y + ent.size.y + 1) / TILE_SIZE);
      const x1 = Math.floor((ent.pos.x + 2) / TILE_SIZE);
      const x2 = Math.floor((ent.pos.x + ent.size.x - 2) / TILE_SIZE);

      if (y >= this.level.tiles.length) return false;
      return this.isSolid(this.level.tiles[y][x1]) || this.isSolid(this.level.tiles[y][x2]);
  }

  private isSolid(tile: TileType): boolean {
      return tile === TileType.GROUND || tile === TileType.BRICK || tile === TileType.QUESTION || tile === TileType.BLOCK || tile === TileType.PIPE_L;
  }

  private resolveMapCollision(ent: Entity) {
    // X Axis
    ent.pos.x += ent.vel.x;
    let left = Math.floor(ent.pos.x / TILE_SIZE);
    let right = Math.floor((ent.pos.x + ent.size.x) / TILE_SIZE);
    let top = Math.floor(ent.pos.y / TILE_SIZE);
    let bottom = Math.floor((ent.pos.y + ent.size.y - 0.1) / TILE_SIZE);

    // Check Left/Right Walls
    if (ent.vel.x > 0) { // Moving Right
        if (this.isSolid(this.getTile(right, top)) || this.isSolid(this.getTile(right, bottom))) {
            ent.pos.x = right * TILE_SIZE - ent.size.x;
            ent.vel.x = ent.type === EntityType.GOOMBA ? -ent.vel.x : 0; // Bounce AI
        }
    } else if (ent.vel.x < 0) { // Moving Left
        if (this.isSolid(this.getTile(left, top)) || this.isSolid(this.getTile(left, bottom))) {
            ent.pos.x = (left + 1) * TILE_SIZE;
            ent.vel.x = ent.type === EntityType.GOOMBA ? -ent.vel.x : 0;
        }
    }

    // Y Axis
    ent.pos.y += ent.vel.y;
    left = Math.floor((ent.pos.x + 2) / TILE_SIZE); // Pinch in slightly to avoid wall friction
    right = Math.floor((ent.pos.x + ent.size.x - 2) / TILE_SIZE);
    top = Math.floor(ent.pos.y / TILE_SIZE);
    bottom = Math.floor((ent.pos.y + ent.size.y) / TILE_SIZE);

    if (ent.vel.y > 0) { // Falling
        if (this.isSolid(this.getTile(left, bottom)) || this.isSolid(this.getTile(right, bottom))) {
            ent.pos.y = bottom * TILE_SIZE - ent.size.y;
            ent.vel.y = 0;
        }
    } else if (ent.vel.y < 0) { // Jumping
        if (this.isSolid(this.getTile(left, top)) || this.isSolid(this.getTile(right, top))) {
            ent.pos.y = (top + 1) * TILE_SIZE;
            ent.vel.y = 0;
            // Break Brick logic here if needed
        }
    }
  }

  private getTile(x: number, y: number): TileType {
      if (y < 0 || y >= this.level.tiles.length) return TileType.EMPTY;
      if (x < 0 || x >= this.level.tiles[0].length) return TileType.GROUND; // Walls at infinity
      return this.level.tiles[y][x];
  }

  private checkEntityCollisions() {
      for (const enemy of this.level.entities) {
          if (enemy.type === EntityType.GOOMBA && !enemy.dead) {
              if (this.checkAABB(this.player, enemy)) {
                  // Check stomp
                  const hitFromAbove = (this.player.pos.y + this.player.size.y) < (enemy.pos.y + enemy.size.y / 2) && this.player.vel.y > 0;

                  if (hitFromAbove) {
                      enemy.dead = true;
                      this.player.vel.y = JUMP_FORCE * 0.5; // Bounce
                      this.score += 100;
                      this.onScoreChange?.(this.score);
                  } else {
                      // Die
                      this.player.dead = true;
                      this.onGameOver?.();
                  }
              }
          }
      }
  }

  private checkAABB(a: Entity, b: Entity): boolean {
      return (
          a.pos.x < b.pos.x + b.size.x &&
          a.pos.x + a.size.x > b.pos.x &&
          a.pos.y < b.pos.y + b.size.y &&
          a.pos.y + a.size.y > b.pos.y
      );
  }

  private draw() {
    // Clear
    this.ctx.fillStyle = COLORS.sky;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Level
    this.renderer.drawLevel(this.level.tiles, this.camera.x);

    // Draw Entities
    this.level.entities.forEach(e => {
        if (!e.dead || (e.dead && e.type === EntityType.GOOMBA)) { // Draw flattened goomba
            this.renderer.drawEntity(e, this.camera.x);
        }
    });

    // Draw Player
    if (!this.player.dead) {
        this.renderer.drawEntity(this.player, this.camera.x);
    }
  }
}
