import React, { useState, useEffect } from 'react';
import { UserPlus, Settings, Database, MessageCircle, CheckCircle2, Trash2, Edit2, Download, Upload, AlertCircle, X, Check, FileDown, FileUp, Calendar, DollarSign, Smartphone, User, Bell } from 'lucide-react';

export default function App() {
    // Carrega os dados salvos na memória do celular ao abrir o app
    const [clients, setClients] = useState(() => JSON.parse(localStorage.getItem('clients')) || []);
    const [pixKey, setPixKey] = useState(() => localStorage.getItem('pixKey') || '');
    const [notificationTime, setNotificationTime] = useState(() => localStorage.getItem('notificationTime') || '09:00'); 
    const [activeTab, setActiveTab] = useState('clients'); 
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const [formData, setFormData] = useState({
        name: '', phone: '', amount: '', dueDate: ''
    });

    // Salva automaticamente qualquer alteração direto no celular
    useEffect(() => {
        localStorage.setItem('clients', JSON.stringify(clients));
        localStorage.setItem('pixKey', pixKey);
        localStorage.setItem('notificationTime', notificationTime);
    }, [clients, pixKey, notificationTime]);

    // --- Sistema de Notificações Diárias ---
    useEffect(() => {
        if (!clients.length) return;

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const interval = setInterval(() => {
            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHour}:${currentMinute}`;
            
            const todayStr = now.toISOString().slice(0, 10);
            const lastNotified = localStorage.getItem('lastNotifiedDate');

            if (currentTime === notificationTime && lastNotified !== todayStr) {
                const expiringToday = clients.filter(client => {
                    if (client.status === 'pago') return false;
                    
                    const todayDate = new Date();
                    todayDate.setHours(0, 0, 0, 0);
                    const [year, month, day] = client.dueDate.split('-');
                    const dueDate = new Date(year, month - 1, day);
                    const diffTime = dueDate - todayDate;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    return diffDays === 0;
                });

                if (expiringToday.length > 0) {
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification("Vencimentos Hoje! 🔔", {
                            body: `Você tem ${expiringToday.length} cliente(s) aguardando o aviso final. Abra o app!`,
                            icon: '/icon-192.png',
                            vibrate: [200, 100, 200]
                        });
                        localStorage.setItem('lastNotifiedDate', todayStr);
                    }
                } else {
                    localStorage.setItem('lastNotifiedDate', todayStr);
                }
            }
        }, 60000); 

        return () => clearInterval(interval);
    }, [clients, notificationTime]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const formatCurrency = (val) => {
        if (!val) return '';
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const getDueDateStatus = (dueDateStr) => {
        if (!dueDateStr) return { color: 'text-gray-700', bg: 'bg-gray-100', emoji: '📅', text: 'Sem data' };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month, day] = dueDateStr.split('-');
        const dueDate = new Date(year, month - 1, day);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) return { color: 'text-gray-600', bg: 'bg-gray-100', emoji: '📅', text: `Vence em ${diffDays} dias` };
        if (diffDays <= 7 && diffDays >= 4) return { color: 'text-purple-600', bg: 'bg-purple-100', emoji: '🟣', text: `Vence em ${diffDays} dias` };
        if (diffDays <= 3 && diffDays >= 1) return { color: 'text-orange-600', bg: 'bg-orange-100', emoji: '🟠', text: diffDays === 1 ? 'Vence AMANHÃ' : `Vence em ${diffDays} dias` };
        if (diffDays === 0) return { color: 'text-red-600', bg: 'bg-red-100', emoji: '🔴', text: 'Vence HOJE' };
        return { color: 'text-red-700', bg: 'bg-red-200', emoji: '🔴', text: `Vencido há ${Math.abs(diffDays)} dias` };
    };

    const handleSaveClient = (e) => {
        e.preventDefault();
        const clientData = {
            ...formData,
            status: editingClient ? editingClient.status : 'pendente',
            id: editingClient ? editingClient.id : Date.now().toString()
        };

        if (editingClient) {
            setClients(clients.map(c => c.id === editingClient.id ? clientData : c));
            showToast("Cliente atualizado!");
        } else {
            setClients([...clients, clientData]);
            showToast("Cliente cadastrado!");
        }
        setIsClientModalOpen(false);
        setEditingClient(null);
        setFormData({ name: '', phone: '', amount: '', dueDate: '' });
    };

    const handleDeleteClient = (clientId) => {
        setConfirmModal({
            title: "Excluir Cliente",
            message: "Tem certeza que deseja apagar este cliente? Esta ação não pode ser desfeita.",
            onConfirm: () => {
                setClients(clients.filter(c => c.id !== clientId));
                showToast("Cliente excluído.");
                setConfirmModal(null);
            }
        });
    };

    const handleToggleStatus = (client) => {
        const newStatus = client.status === 'pago' ? 'pendente' : 'pago';
        setClients(clients.map(c => c.id === client.id ? { ...c, status: newStatus } : c));
        showToast(`Status atualizado para ${newStatus}.`);
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
        showToast("Configurações salvas!");
    };

    const generateWhatsAppLink = (client, type) => {
        const number = client.phone.replace(/\D/g, '');
        if (!number) {
            showToast("Número de telefone inválido.", "error");
            return "#";
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month, day] = client.dueDate.split('-');
        const dueDate = new Date(year, month - 1, day);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let text = '';
        if (type === 'reminder') {
            let timeText = '';
            if (diffDays > 1) {
                timeText = `vence em *${diffDays} dias*`;
            } else if (diffDays === 1) {
                timeText = `vence *AMANHÃ*`;
            } else if (diffDays === 0) {
                timeText = `vence *HOJE*`;
            } else {
                timeText = `venceu há *${Math.abs(diffDays)} dias*`;
            }

            const status = getDueDateStatus(client.dueDate);

            text = `Olá, *${client.name}*! 👋\n\nPassando para lembrar que o seu plano ${timeText} (${status.emoji} ${formatDate(client.dueDate)}).\n\n💰 *Valor:* ${formatCurrency(client.amount)}\n🔑 *Chave PIX:* ${pixKey}\n\nPor favor, assim que realizar o pagamento, me envie o comprovante por aqui para darmos baixa. ✅\n\nQualquer dúvida, estou à disposição!`;
        } else if (type === 'today') {
            const status = getDueDateStatus(client.dueDate);
            if (diffDays < 0) {
                text = `Olá, *${client.name}*! ⚠️\n\nNotei que o seu plano venceu há *${Math.abs(diffDays)} dias* (${status.emoji} ${formatDate(client.dueDate)}) e o seu acesso foi interrompido.\n\nGostaria de reativar sua assinatura? Se preferir, podemos conversar sobre opções para mudar de plano, caso não esteja totalmente satisfeito! 🔄\n\n💰 *Valor para reativar:* ${formatCurrency(client.amount)}\n🔑 *Chave PIX:* ${pixKey}\n\nFico no aguardo do seu retorno para restaurarmos seu acesso. 🚀`;
            } else {
                text = `Olá, *${client.name}*! ⚠️\n\nO seu plano *vence HOJE* (${status.emoji} ${formatDate(client.dueDate)}) e será interrompido caso não haja renovação.\n\n💰 *Valor:* ${formatCurrency(client.amount)}\n🔑 *Chave PIX:* ${pixKey}\n\nAguardo o envio do comprovante para manter o seu acesso ativo. 🚀`;
            }
        }

        return `https://wa.me/55${number}?text=${encodeURIComponent(text)}`;
    };

    const handleExport = () => {
        const dataStr = JSON.stringify({ clients, pixKey, notificationTime }, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `backup_clientes_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Backup exportado!");
    };

    const handleImport = (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const reader = new FileReader();

        setConfirmModal({
            title: "Importar Dados",
            message: "Atenção: Restaurar dados irá adicionar os clientes do arquivo à sua lista atual. Deseja continuar?",
            onConfirm: () => {
                reader.onload = (event) => {
                    try {
                        const parsed = JSON.parse(event.target.result);
                        if (parsed.pixKey !== undefined) setPixKey(parsed.pixKey);
                        if (parsed.notificationTime !== undefined) setNotificationTime(parsed.notificationTime);
                        
                        if (parsed.clients && Array.isArray(parsed.clients)) {
                            const newClients = [...clients, ...parsed.clients];
                            const uniqueClients = Array.from(new Map(newClients.map(c => [c.id, c])).values());
                            setClients(uniqueClients);
                        } else if (Array.isArray(parsed)) {
                            setClients(parsed);
                        }
                        showToast("Dados restaurados com sucesso!");
                    } catch (error) {
                        showToast("Erro ao ler arquivo de backup.", "error");
                    }
                };
                reader.readAsText(file);
                setConfirmModal(null);
            }
        });
    };

    const renderClients = () => (
        <div className="pb-24 pt-4 px-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-400 mt-20">
                    <Database size={48} className="mb-4 text-gray-300" />
                    <p>Nenhum cliente cadastrado.</p>
                    <p className="text-sm mt-1">Toque no + para adicionar.</p>
                </div>
            ) : (
                clients.map(client => {
                    const dueDateStatus = getDueDateStatus(client.dueDate);
                    
                    return (
                    <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative overflow-hidden transition-all hover:shadow-md">
                        <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl text-white shadow-sm cursor-pointer transition-colors ${client.status === 'pago' ? 'bg-[#25D366]' : 'bg-orange-500'}`}
                             onClick={() => handleToggleStatus(client)}>
                            {client.status === 'pago' ? 'PAGO' : 'PENDENTE'}
                        </div>

                        <div className="pr-20 mb-3">
                            <h3 className="font-bold text-lg text-gray-800 leading-tight">{client.name}</h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Smartphone size={14} className="mr-1" /> {client.phone}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 p-2 rounded-lg">
                            <div>
                                <span className="text-xs text-gray-400 block uppercase tracking-wider">Vencimento</span>
                                <span className={`font-semibold flex items-center ${dueDateStatus.color}`}>
                                    <span className="mr-1 text-sm">{dueDateStatus.emoji}</span> {formatDate(client.dueDate)}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${dueDateStatus.bg} ${dueDateStatus.color}`}>
                                    {dueDateStatus.text}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block uppercase tracking-wider">Valor</span>
                                <span className="font-semibold text-gray-700 flex items-center mt-0.5">
                                    <DollarSign size={14} className="mr-1 text-gray-400" /> {formatCurrency(client.amount)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <a href={generateWhatsAppLink(client, 'reminder')} target="_blank" rel="noopener noreferrer" 
                                   className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center transition-colors">
                                    <MessageCircle size={14} className="mr-1" /> Aviso Prévio
                                </a>
                                <a href={generateWhatsAppLink(client, 'today')} target="_blank" rel="noopener noreferrer" 
                                   className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center transition-colors">
                                    <AlertCircle size={14} className="mr-1" /> Aviso Final
                                </a>
                            </div>
                            
                            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 justify-end">
                                <button onClick={() => { setEditingClient(client); setFormData(client); setIsClientModalOpen(true); }} className="px-3 py-1.5 text-gray-500 hover:text-blue-600 flex items-center rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
                                    <Edit2 size={16} className="mr-1" /> Editar
                                </button>
                                <button onClick={() => handleDeleteClient(client.id)} className="px-3 py-1.5 text-gray-500 hover:text-red-600 flex items-center rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                                    <Trash2 size={16} className="mr-1" /> Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )})
            )}

            <button 
                onClick={() => { setEditingClient(null); setFormData({ name: '', phone: '', amount: '', dueDate: '' }); setIsClientModalOpen(true); }}
                className="fixed bottom-20 right-4 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#20bd5a] hover:scale-105 transition-all z-10">
                <UserPlus size={24} />
            </button>
        </div>
    );

    const renderSettings = () => (
        <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Settings className="mr-2 text-[#25D366]" /> Configurações
            </h2>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSaveSettings}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sua Chave PIX</label>
                    <p className="text-xs text-gray-500 mb-4">Esta chave será enviada nas mensagens automáticas do WhatsApp.</p>
                    <input 
                        type="text" 
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="Ex: 123.456.789-00 ou email@pix.com"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-all mb-6"
                        required
                    />

                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Bell size={18} className="mr-2 text-yellow-500"/> Horário do Aviso Diário
                    </label>
                    <p className="text-xs text-gray-500 mb-4">Escolha a hora que deseja ser notificado no celular sobre os clientes que vencem hoje (Lembre-se: o app não pode estar totalmente fechado no Android).</p>
                    <input 
                        type="time" 
                        value={notificationTime}
                        onChange={(e) => setNotificationTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-all mb-6"
                        required
                    />

                    <button type="submit" className="w-full bg-[#25D366] text-white py-3 rounded-lg font-semibold shadow-sm hover:bg-[#20bd5a] transition-colors flex justify-center items-center">
                        <Check size={18} className="mr-2" /> Salvar Configurações
                    </button>
                </form>
            </div>
        </div>
    );

    const renderBackup = () => (
        <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Database className="mr-2 text-[#25D366]" /> Backup e Restauração
            </h2>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center"><FileDown size={18} className="mr-2 text-blue-500"/> Exportar Dados</h3>
                    <p className="text-sm text-gray-500 mb-3">Salve todos os seus clientes e configurações em um arquivo JSON para trocar de aparelho.</p>
                    <button onClick={handleExport} className="w-full bg-white border-2 border-blue-500 text-blue-500 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex justify-center items-center">
                        <Download size={18} className="mr-2" /> Fazer Backup
                    </button>
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center"><FileUp size={18} className="mr-2 text-orange-500"/> Importar Dados</h3>
                    <p className="text-sm text-gray-500 mb-3">Restaure um backup anterior. Os clientes do arquivo serão adicionados à sua lista.</p>
                    <label className="w-full bg-white border-2 border-orange-500 text-orange-500 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors flex justify-center items-center cursor-pointer">
                        <Upload size={18} className="mr-2" /> Restaurar Backup
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-16">
            <header className="bg-[#25D366] text-white pt-8 pb-4 px-6 shadow-md sticky top-0 z-20">
                <h1 className="text-2xl font-bold tracking-tight">Gerenciador PRO</h1>
                <p className="text-green-100 text-sm opacity-90">Controle de Assinaturas</p>
            </header>

            <main className="max-w-md mx-auto">
                {activeTab === 'clients' && renderClients()}
                {activeTab === 'settings' && renderSettings()}
                {activeTab === 'backup' && renderBackup()}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around pb-safe z-20">
                <button 
                    onClick={() => setActiveTab('clients')} 
                    className={`flex-1 py-3 flex flex-col items-center justify-center transition-colors ${activeTab === 'clients' ? 'text-[#25D366]' : 'text-gray-400 hover:text-gray-600'}`}>
                    <User size={24} className="mb-1" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Clientes</span>
                </button>
                <button 
                    onClick={() => setActiveTab('settings')} 
                    className={`flex-1 py-3 flex flex-col items-center justify-center transition-colors ${activeTab === 'settings' ? 'text-[#25D366]' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Settings size={24} className="mb-1" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Config</span>
                </button>
                <button 
                    onClick={() => setActiveTab('backup')} 
                    className={`flex-1 py-3 flex flex-col items-center justify-center transition-colors ${activeTab === 'backup' ? 'text-[#25D366]' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Database size={24} className="mb-1" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Backup</span>
                </button>
            </nav>

            {isClientModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md sm:rounded-xl rounded-t-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                            <button onClick={() => setIsClientModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveClient} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#25D366] outline-none transition-all" placeholder="Ex: João Silva" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (com DDD)</label>
                                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#25D366] outline-none transition-all" placeholder="Ex: 11999999999" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Plano</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">R$</span>
                                        <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#25D366] outline-none transition-all" placeholder="0.00" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                                    <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#25D366] outline-none transition-all" />
                                </div>
                            </div>
                            <div className="pt-4 pb-safe">
                                <button type="submit" className="w-full bg-[#25D366] text-white py-3.5 rounded-lg font-bold shadow-md hover:bg-[#20bd5a] transition-colors">
                                    Salvar Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {confirmModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{confirmModal.title}</h3>
                        <p className="text-gray-600 mb-6">{confirmModal.message}</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmModal(null)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                                Cancelar
                            </button>
                            <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-[#25D366] text-white rounded-lg font-medium shadow-sm hover:bg-[#20bd5a] transition-colors">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
                    <div className={`px-4 py-3 rounded-full shadow-lg font-medium text-sm flex items-center space-x-2 ${
                        toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'
                    }`}>
                        {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} className="text-[#25D366]" />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
