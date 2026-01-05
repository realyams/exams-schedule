import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, Plus, ChevronRight, ChevronDown, BookOpen, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const StructureManager = () => {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDept, setExpandedDept] = useState<string | null>(null);
    const [expandedFormation, setExpandedFormation] = useState<string | null>(null);

    // Form states
    const [newFormationName, setNewFormationName] = useState('');
    const [newModuleName, setNewModuleName] = useState('');
    const [addingFormationTo, setAddingFormationTo] = useState<number | null>(null);
    const [addingModuleTo, setAddingModuleTo] = useState<number | null>(null);

    // Data cache
    const [formations, setFormations] = useState<{ [key: number]: any[] }>({});
    const [modules, setModules] = useState<{ [key: number]: any[] }>({});

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const data = await api.get('/departments');
            setDepartments(data);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const fetchFormations = async (deptId: number) => {
        try {
            // Need to filter formations by Dept. 
            // The API /public/formations returns ALL if no deptId provided?
            // Actually server/index.js supports deptId query.
            const data = await api.get(`/formations?deptId=${deptId}`);
            setFormations(prev => ({ ...prev, [deptId]: data }));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchModules = async (formationId: number) => {
        try {
            const data = await api.get(`/modules?formationId=${formationId}`);
            setModules(prev => ({ ...prev, [formationId]: data }));
        } catch (e) {
            console.error(e);
        }
    };

    const toggleDept = (deptId: number) => {
        if (expandedDept === deptId.toString()) {
            setExpandedDept(null);
        } else {
            setExpandedDept(deptId.toString());
            if (!formations[deptId]) fetchFormations(deptId);
        }
    };

    const toggleFormation = (formationId: number) => {
        if (expandedFormation === formationId.toString()) {
            setExpandedFormation(null);
        } else {
            setExpandedFormation(formationId.toString());
            if (!modules[formationId]) fetchModules(formationId);
        }
    };

    const handleCreateFormation = async (deptId: number) => {
        if (!newFormationName.trim()) return;
        try {
            await api.post('/formations', { name: newFormationName, department_id: deptId });
            toast.success("Filière créée !");
            setNewFormationName('');
            setAddingFormationTo(null);
            fetchFormations(deptId);
        } catch (e) {
            toast.error("Erreur création filière");
        }
    };

    const handleCreateModule = async (formationId: number) => {
        if (!newModuleName.trim()) return;
        try {
            await api.post('/modules', { name: newModuleName, formation_id: formationId });
            toast.success("Module ajouté !");
            setNewModuleName('');
            setAddingModuleTo(null);
            fetchModules(formationId);
        } catch (e) {
            toast.error("Erreur création module");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                <Building2 className="w-8 h-8 text-primary" />
                Structure de l'Université
            </h2>

            <div className="grid gap-4">
                {departments.map(dept => (
                    <Card key={dept.id} className="overflow-hidden border-l-4 border-l-primary/50">
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => toggleDept(dept.id)}
                        >
                            <div className="flex items-center gap-3">
                                {expandedDept === dept.id.toString() ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                <div>
                                    <h3 className="font-bold text-lg">{dept.name}</h3>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{dept.code}</span>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setAddingFormationTo(dept.id); }}>
                                <Plus size={16} className="mr-1" /> Filière
                            </Button>
                        </div>

                        {expandedDept === dept.id.toString() && (
                            <div className="bg-muted/10 p-4 border-t border-border animate-slide-down">
                                {addingFormationTo === dept.id && (
                                    <div className="flex gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
                                        <Input
                                            placeholder="Nom de la nouvelle filière..."
                                            value={newFormationName}
                                            onChange={e => setNewFormationName(e.target.value)}
                                            className="max-w-md"
                                        />
                                        <Button onClick={() => handleCreateFormation(dept.id)}>Créer</Button>
                                        <Button variant="ghost" onClick={() => setAddingFormationTo(null)}>Annuler</Button>
                                    </div>
                                )}

                                <div className="space-y-2 ml-4 md:ml-8">
                                    {(formations[dept.id] || []).length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">Aucune filière trouvée.</p>
                                    ) : (
                                        (formations[dept.id] || []).map(formation => (
                                            <div key={formation.id} className="border border-border rounded-lg bg-background">
                                                <div
                                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                                                    onClick={() => toggleFormation(formation.id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen size={16} className="text-accent" />
                                                        <span className="font-medium">{formation.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {(modules[formation.id]?.length || 0) + ' modules'} (chargement...)
                                                        </Badge>
                                                        <Button size="icon" variant="ghost" h-6 w-6 onClick={(e) => { e.stopPropagation(); setAddingModuleTo(formation.id); }}>
                                                            <Plus size={14} />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {expandedFormation === formation.id.toString() && (
                                                    <div className="mt-2 pl-4 pr-2 pb-2 border-t border-border/50 bg-muted/5">
                                                        {addingModuleTo === formation.id && (
                                                            <div className="flex gap-2 my-2 p-2 bg-background shadow-sm rounded-md border border-border">
                                                                <Input
                                                                    placeholder="Nom du module..."
                                                                    value={newModuleName}
                                                                    onChange={e => setNewModuleName(e.target.value)}
                                                                    className="h-8 text-sm"
                                                                />
                                                                <Button size="sm" onClick={() => handleCreateModule(formation.id)}>Ajouter</Button>
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                                            {(modules[formation.id] || []).map(mod => (
                                                                <div key={mod.id} className="flex items-center gap-2 p-2 rounded bg-background border border-border/50 text-sm">
                                                                    <Layers size={14} className="text-muted-foreground" />
                                                                    {mod.name}
                                                                </div>
                                                            ))}
                                                            {(modules[formation.id] || []).length === 0 && (
                                                                <span className="text-xs text-muted-foreground p-2">Aucun module défini.</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};
