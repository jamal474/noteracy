import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { GripVertical } from 'lucide-react';

/**
 * Custom NodeView for OrderedList.
 * Same pattern as BulletListComponent — entire list is one drag atom.
 */
const OrderedListComponent = () => (
  <NodeViewWrapper
    as="section"
    className="ordered-list-wrapper group/list relative not-draggable"
    data-type="orderedList"
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

    <NodeViewContent as="ol" />
  </NodeViewWrapper>
);

export default OrderedListComponent;
