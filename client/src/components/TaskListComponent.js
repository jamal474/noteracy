import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { GripVertical } from 'lucide-react';

/**
 * Custom NodeView for TaskList.
 * Wraps the entire task list in one draggable atom.
 */
const TaskListComponent = () => (
  <NodeViewWrapper
    as="section"
    className="task-list-wrapper group/list relative not-draggable"
    data-type="taskList"
  >
    {/* Custom drag handle — visible on hover */}
    <div
      className="node-drag-handle"
      contentEditable={false}
      draggable="true"
      data-drag-handle=""
    >
      <GripVertical size={14} />
    </div>

    <NodeViewContent as="ul" />
  </NodeViewWrapper>
);

export default TaskListComponent;
