import { useMemo } from 'react';
import type { Task, Block, TaskGroup } from '../types';

/**
 * Build a tree of blocks from task data
 */
function buildBlockTree(tasks: Task[]): Block[] {
  const blockMap = new Map<string, Block>();

  // First pass: collect all unique block paths
  for (const task of tasks) {
    if (task.blockPath.length === 0) continue;

    // Build each level of the path
    for (let i = 0; i < task.blockPath.length; i++) {
      const pathSegments = task.blockPath.slice(0, i + 1);
      const pathId = pathSegments.join('/');

      if (!blockMap.has(pathId)) {
        blockMap.set(pathId, {
          pathId,
          name: pathSegments[pathSegments.length - 1],
          path: pathSegments,
          taskCount: 0,
          children: []
        });
      }
    }
  }

  // Second pass: count tasks per block
  for (const task of tasks) {
    if (task.blockPath.length === 0) continue;

    // Increment count for the deepest block
    const pathId = task.blockPath.join('/');
    const block = blockMap.get(pathId);
    if (block) {
      block.taskCount++;
    }
  }

  // Third pass: build tree structure
  const rootBlocks: Block[] = [];

  for (const block of blockMap.values()) {
    if (block.path.length === 1) {
      // This is a root block
      rootBlocks.push(block);
    } else {
      // Find parent and add as child
      const parentPath = block.path.slice(0, -1).join('/');
      const parent = blockMap.get(parentPath);
      if (parent) {
        // Check if already added
        if (!parent.children.find(c => c.pathId === block.pathId)) {
          parent.children.push(block);
        }
      }
    }
  }

  // Sort blocks alphabetically
  const sortBlocks = (blocks: Block[]) => {
    blocks.sort((a, b) => a.name.localeCompare(b.name));
    for (const block of blocks) {
      sortBlocks(block.children);
    }
  };
  sortBlocks(rootBlocks);

  return rootBlocks;
}

/**
 * Group tasks by their block path
 */
function groupTasksByBlock(tasks: Task[], blocks: Block[]): TaskGroup[] {
  const groups: TaskGroup[] = [];

  // Tasks without a block
  const unassignedTasks = tasks.filter(t => t.blockPath.length === 0);
  if (unassignedTasks.length > 0) {
    groups.push({
      block: {
        pathId: '',
        name: 'Sin asignar',
        path: [],
        taskCount: unassignedTasks.length,
        children: []
      },
      tasks: unassignedTasks,
      subGroups: []
    });
  }

  // Group tasks by root block
  for (const block of blocks) {
    const group = buildTaskGroup(block, tasks);
    if (group.tasks.length > 0 || group.subGroups.length > 0) {
      groups.push(group);
    }
  }

  return groups;
}

/**
 * Recursively build a task group for a block
 */
function buildTaskGroup(block: Block, allTasks: Task[]): TaskGroup {
  // Get tasks that belong directly to this block (exact path match)
  const directTasks = allTasks.filter(task => {
    const taskPath = task.blockPath.join('/');
    return taskPath === block.pathId;
  });

  // Build sub-groups for children
  const subGroups: TaskGroup[] = [];
  for (const childBlock of block.children) {
    const subGroup = buildTaskGroup(childBlock, allTasks);
    if (subGroup.tasks.length > 0 || subGroup.subGroups.length > 0) {
      subGroups.push(subGroup);
    }
  }

  return {
    block,
    tasks: directTasks,
    subGroups
  };
}

/**
 * Hook for managing blocks and task grouping
 */
export function useBlocks(tasks: Task[]) {
  // Build block tree from tasks
  const blocks = useMemo(() => buildBlockTree(tasks), [tasks]);

  // Group tasks by block
  const taskGroups = useMemo(() => groupTasksByBlock(tasks, blocks), [tasks, blocks]);

  // Get all unique block paths (flattened)
  const allBlockPaths = useMemo(() => {
    const paths: string[][] = [];
    const collectPaths = (block: Block) => {
      paths.push(block.path);
      for (const child of block.children) {
        collectPaths(child);
      }
    };
    for (const block of blocks) {
      collectPaths(block);
    }
    return paths;
  }, [blocks]);

  // Get root-level blocks
  const rootBlocks = useMemo(() => blocks, [blocks]);

  // Find a block by path
  const findBlock = (path: string[]): Block | null => {
    const pathId = path.join('/');
    const search = (blocks: Block[]): Block | null => {
      for (const block of blocks) {
        if (block.pathId === pathId) return block;
        const found = search(block.children);
        if (found) return found;
      }
      return null;
    };
    return search(blocks);
  };

  return {
    blocks,
    taskGroups,
    allBlockPaths,
    rootBlocks,
    findBlock
  };
}
