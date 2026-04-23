import { useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import {
  useBleTags,
  useCreateBleTag,
  useUpdateBleTag,
  useDeleteBleTag,
  useAssignBleTag,
  useUnassignBleTag,
} from '@/hooks/useBLE'
import { useItems } from '@/hooks/useItems'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, Tag, Link2, Unlink } from 'lucide-react'
import { BleTag } from '@/types/ble'

export function BleTagsPage() {
  const { data: tags, isLoading } = useBleTags()
  const { data: items } = useItems()
  const createTag = useCreateBleTag()
  const updateTag = useUpdateBleTag()
  const deleteTag = useDeleteBleTag()
  const assignTag = useAssignBleTag()
  const unassignTag = useUnassignBleTag()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<BleTag | null>(null)
  const [assigningTag, setAssigningTag] = useState<BleTag | null>(null)
  const [tagId, setTagId] = useState('')
  const [name, setName] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')

  const openCreate = () => {
    setEditingTag(null)
    setTagId('')
    setName('')
    setDialogOpen(true)
  }

  const openEdit = (tag: BleTag) => {
    setEditingTag(tag)
    setTagId(tag.tag_id)
    setName(tag.name)
    setDialogOpen(true)
  }

  const openAssign = (tag: BleTag) => {
    setAssigningTag(tag)
    setSelectedItemId(tag.item_id || '')
    setAssignDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagId.trim() || !name.trim()) return

    if (editingTag) {
      updateTag.mutate({ id: editingTag.id, data: { name } })
    } else {
      createTag.mutate({ tag_id: tagId, name })
    }
    setDialogOpen(false)
  }

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!assigningTag || !selectedItemId) return
    assignTag.mutate({ id: assigningTag.id, data: { item_id: selectedItemId } })
    setAssignDialogOpen(false)
  }

  const handleUnassign = (tag: BleTag) => {
    if (confirm(`Unassign tag "${tag.name}" from item?`)) {
      unassignTag.mutate(tag.id)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      deleteTag.mutate(id)
    }
  }

  const trackableItems = items?.filter((i) => i.item_type === 'trackable') || []

  return (
    <PageShell
      title="BLE Tags"
      description="Manage BLE asset tags"
      actions={
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Register Tag
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !tags || tags.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tags registered yet.</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Register your first tag
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tags.map((tag) => (
            <Card key={tag.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{tag.name}</h3>
                    <span className="text-xs text-muted-foreground font-mono">{tag.tag_id}</span>
                  </div>
                  <div className="mt-1">
                    {tag.item_id ? (
                      <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600">
                        <Link2 className="h-3 w-3 mr-1" />
                        {tag.item_name || 'Assigned'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Unassigned
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {tag.item_id ? (
                    <Button variant="ghost" size="icon" onClick={() => handleUnassign(tag)} title="Unassign">
                      <Unlink className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => openAssign(tag)} title="Assign to item">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(tag)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Register Tag'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tagId">Tag ID</Label>
              <Input
                id="tagId"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                placeholder="e.g. tag-001"
                required
                disabled={!!editingTag}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Projector Tag"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTag.isPending || updateTag.isPending}>
                {editingTag ? 'Update' : 'Register'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tag to Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item">Select Item</Label>
              <Select
                id="item"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                required
              >
                <option value="">Choose an item...</option>
                {trackableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignTag.isPending}>
                Assign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
