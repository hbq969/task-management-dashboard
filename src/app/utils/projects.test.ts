import { describe, expect, test } from 'bun:test';
import { sortProjectsByOrder, swapProjectOrder } from './projects';

describe('sortProjectsByOrder', () => {
  test('sorts projects by order in ascending order without mutating the source list', () => {
    const projects = [
      { id: '2', name: '第二个', color: '#000', taskCount: 0, order: 2 },
      { id: '0', name: '第零个', color: '#000', taskCount: 0, order: 0 },
      { id: '1', name: '第一个', color: '#000', taskCount: 0, order: 1 },
    ];

    expect(sortProjectsByOrder(projects).map(project => project.id)).toEqual(['0', '1', '2']);
    expect(projects.map(project => project.id)).toEqual(['2', '0', '1']);
  });
});

describe('swapProjectOrder', () => {
  test('swaps the order values of the dragged and target projects without mutating the source list', () => {
    const projects = [
      { id: 'a', name: '项目 A', color: '#000', taskCount: 0, order: 0 },
      { id: 'b', name: '项目 B', color: '#000', taskCount: 0, order: 1 },
      { id: 'c', name: '项目 C', color: '#000', taskCount: 0, order: 2 },
    ];

    const swapped = swapProjectOrder(projects, 'a', 'c');

    expect(swapped.map(project => [project.id, project.order])).toEqual([
      ['a', 2],
      ['b', 1],
      ['c', 0],
    ]);
    expect(projects.map(project => [project.id, project.order])).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
  });
});
