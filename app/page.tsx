'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Search, X, Plus, DollarSign, Loader2 } from 'lucide-react';

interface Gasto {
  id: number;
  concepto: string;
  importe: number;
  categoria: string;
  fecha: string;
}

const CATEGORIAS = [
  { value: 'alimentacion', label: 'Alimentacion', color: 'bg-orange-100 text-orange-700' },
  { value: 'transporte', label: 'Transporte', color: 'bg-blue-100 text-blue-700' },
  { value: 'entretenimiento', label: 'Entretenimiento', color: 'bg-purple-100 text-purple-700' },
  { value: 'servicios', label: 'Servicios', color: 'bg-green-100 text-green-700' },
  { value: 'otros', label: 'Otros', color: 'bg-gray-100 text-gray-700' },
];

function getCategoriaColor(categoria: string) {
  return CATEGORIAS.find(c => c.value === categoria)?.color || 'bg-gray-100 text-gray-700';
}

function getCategoriaLabel(categoria: string) {
  return CATEGORIAS.find(c => c.value === categoria)?.label || categoria;
}

export default function Home() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [concepto, setConcepto] = useState('');
  const [importe, setImporte] = useState('');
  const [categoria, setCategoria] = useState('alimentacion');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const [errors, setErrors] = useState<{ concepto?: string; importe?: string }>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [sortOrder, setSortOrder] = useState<'reciente' | 'antiguo'>('reciente');

  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [editConcepto, setEditConcepto] = useState('');
  const [editImporte, setEditImporte] = useState('');
  const [editCategoria, setEditCategoria] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editErrors, setEditErrors] = useState<{ concepto?: string; importe?: string }>({});

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchGastos();
  }, []);

  async function fetchGastos() {
    try {
      const res = await fetch('/api/gastos');
      const data = await res.json();
      setGastos(data);
    } catch (error) {
      console.error('Error fetching gastos:', error);
    } finally {
      setLoading(false);
    }
  }

  function validateForm(c: string, i: string) {
    const newErrors: { concepto?: string; importe?: string } = {};
    if (!c.trim()) newErrors.concepto = 'El concepto es obligatorio';
    if (!i || isNaN(parseFloat(i)) || parseFloat(i) <= 0) {
      newErrors.importe = 'Ingresa un importe valido';
    }
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formErrors = validateForm(concepto, importe);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepto: concepto.trim(),
          importe: parseFloat(importe),
          categoria,
          fecha,
        }),
      });
      const data = await res.json();
      setGastos(data);
      setConcepto('');
      setImporte('');
      setCategoria('alimentacion');
      setFecha(new Date().toISOString().split('T')[0]);
      setErrors({});
    } catch (error) {
      console.error('Error adding gasto:', error);
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(gasto: Gasto) {
    setEditingGasto(gasto);
    setEditConcepto(gasto.concepto);
    setEditImporte(gasto.importe.toString());
    setEditCategoria(gasto.categoria);
    setEditFecha(gasto.fecha);
    setEditErrors({});
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGasto) return;

    const formErrors = validateForm(editConcepto, editImporte);
    setEditErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/gastos/${editingGasto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepto: editConcepto.trim(),
          importe: parseFloat(editImporte),
          categoria: editCategoria,
          fecha: editFecha,
        }),
      });
      const data = await res.json();
      setGastos(data);
      setEditingGasto(null);
    } catch (error) {
      console.error('Error updating gasto:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/gastos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      setGastos(data);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting gasto:', error);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredGastos = useMemo(() => {
    let result = [...gastos];

    if (searchTerm) {
      result = result.filter(g =>
        g.concepto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategoria) {
      result = result.filter(g => g.categoria === filterCategoria);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return sortOrder === 'reciente' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [gastos, searchTerm, filterCategoria, sortOrder]);

  const totalGastado = useMemo(() => {
    return gastos.reduce((sum, g) => sum + g.importe, 0);
  }, [gastos]);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-foreground)]">
            Gestor de Gastos Personales
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section className="text-center py-4">
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            Registra, busca y controla tus gastos en tiempo real
          </p>
          <div className="inline-flex items-center gap-2 bg-white rounded-lg px-6 py-3 shadow-sm border border-[var(--color-border)]">
            <DollarSign className="w-5 h-5 text-[var(--color-amount)]" />
            <span className="text-sm text-[var(--color-text-muted)]">Total Gastado:</span>
            <span className="text-xl font-bold text-[var(--color-amount)]">
              {formatCurrency(totalGastado)}
            </span>
          </div>
        </section>

        <Card className="p-4 md:p-6 bg-white border-[var(--color-border)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="concepto" className="text-sm font-medium text-[var(--color-foreground)]">
                  Concepto
                </label>
                <Input
                  id="concepto"
                  type="text"
                  placeholder="Ej: Cafe, gasolina, entrada de cine"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className={errors.concepto ? 'border-[var(--color-destructive)]' : ''}
                />
                {errors.concepto && (
                  <p className="text-xs text-[var(--color-destructive)]">{errors.concepto}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="importe" className="text-sm font-medium text-[var(--color-foreground)]">
                  Importe
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                  <Input
                    id="importe"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={importe}
                    onChange={(e) => setImporte(e.target.value)}
                    className={`pl-7 ${errors.importe ? 'border-[var(--color-destructive)]' : ''}`}
                  />
                </div>
                {errors.importe && (
                  <p className="text-xs text-[var(--color-destructive)]">{errors.importe}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="categoria" className="text-sm font-medium text-[var(--color-foreground)]">
                  Categoria
                </label>
                <select
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[var(--color-input)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="fecha" className="text-sm font-medium text-[var(--color-foreground)]">
                  Fecha
                </label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Agregar Gasto
            </Button>
          </form>
        </Card>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <Input
              type="text"
              placeholder="Buscar gastos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="h-10 rounded-md border border-[var(--color-input)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <option value="">Todas las categorias</option>
            {CATEGORIAS.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'reciente' | 'antiguo')}
            className="h-10 rounded-md border border-[var(--color-input)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <option value="reciente">Mas reciente primero</option>
            <option value="antiguo">Mas antiguo primero</option>
          </select>
        </div>

        <section>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--color-text-muted)]" />
              <p className="mt-2 text-[var(--color-text-muted)]">Cargando gastos...</p>
            </div>
          ) : filteredGastos.length === 0 ? (
            <Card className="p-8 text-center bg-white border-[var(--color-border)]">
              <p className="text-[var(--color-text-muted)]">
                {gastos.length === 0
                  ? 'No hay gastos registrados'
                  : 'No se encontraron gastos con los filtros aplicados'}
              </p>
            </Card>
          ) : (
            <>
              <div className="hidden md:block">
                <div className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-foreground)]">Concepto</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-foreground)]">Categoria</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-foreground)]">Fecha</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-foreground)]">Importe</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-foreground)]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGastos.map((gasto) => (
                        <tr key={gasto.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-card)]">
                          <td className="px-4 py-3 text-sm font-medium text-[var(--color-foreground)]">{gasto.concepto}</td>
                          <td className="px-4 py-3">
                            <Badge className={`${getCategoriaColor(gasto.categoria)} text-xs`}>
                              {getCategoriaLabel(gasto.categoria)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{formatDate(gasto.fecha)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-[var(--color-amount)] text-right">
                            {formatCurrency(gasto.importe)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openEditModal(gasto)}
                              className="text-xs text-[var(--color-ring)] hover:underline mr-3"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(gasto.id)}
                              className="text-xs text-[var(--color-destructive)] hover:underline"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {filteredGastos.map((gasto) => (
                  <Card key={gasto.id} className="p-4 bg-white border-[var(--color-border)]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-[var(--color-foreground)]">{gasto.concepto}</p>
                        <Badge className={`${getCategoriaColor(gasto.categoria)} text-xs mt-1`}>
                          {getCategoriaLabel(gasto.categoria)}
                        </Badge>
                      </div>
                      <p className="font-bold text-[var(--color-amount)]">{formatCurrency(gasto.importe)}</p>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--color-border)]">
                      <p className="text-sm text-[var(--color-text-muted)]">{formatDate(gasto.fecha)}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditModal(gasto)}
                          className="text-xs text-[var(--color-ring)] hover:underline flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" /> Editar
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(gasto.id)}
                          className="text-xs text-[var(--color-destructive)] hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {editingGasto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">Editar Gasto</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="edit-concepto" className="text-sm font-medium text-[var(--color-foreground)]">
                  Concepto
                </label>
                <Input
                  id="edit-concepto"
                  type="text"
                  value={editConcepto}
                  onChange={(e) => setEditConcepto(e.target.value)}
                  className={editErrors.concepto ? 'border-[var(--color-destructive)]' : ''}
                />
                {editErrors.concepto && (
                  <p className="text-xs text-[var(--color-destructive)]">{editErrors.concepto}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-importe" className="text-sm font-medium text-[var(--color-foreground)]">
                  Importe
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                  <Input
                    id="edit-importe"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editImporte}
                    onChange={(e) => setEditImporte(e.target.value)}
                    className={`pl-7 ${editErrors.importe ? 'border-[var(--color-destructive)]' : ''}`}
                  />
                </div>
                {editErrors.importe && (
                  <p className="text-xs text-[var(--color-destructive)]">{editErrors.importe}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-categoria" className="text-sm font-medium text-[var(--color-foreground)]">
                  Categoria
                </label>
                <select
                  id="edit-categoria"
                  value={editCategoria}
                  onChange={(e) => setEditCategoria(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[var(--color-input)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-fecha" className="text-sm font-medium text-[var(--color-foreground)]">
                  Fecha
                </label>
                <Input
                  id="edit-fecha"
                  type="date"
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Guardar cambios
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingGasto(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm p-6 bg-white">
            <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-2">Confirmar eliminacion</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Esta seguro de que desea eliminar este gasto? Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={submitting}
                className="flex-1 bg-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/90 text-white"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Eliminar
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
