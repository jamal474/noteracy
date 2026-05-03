import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { GripVertical } from 'lucide-react';

/**
 * Custom NodeView for BulletList.
 * Uses Tiptap's native `draggable` + `data-drag-handle` so the entire
 * list is treated as ONE draggable atom — one handle, not one per <li>.
 */
const BulletListComponent = () => (
  <NodeViewWrapper
    as="section"
    className="bullet-list-wrapper group/list relative not-draggable"
    data-type="bulletList"
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

export default BulletListComponent;
