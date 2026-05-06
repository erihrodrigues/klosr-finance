import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getLojas, getFechamentos } from '../firebase/db'
import { alterarNome, alterarSenha } from '../firebase/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Settings() {
  const { user, perfil } = useAuth()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [lojas, setLojas] = useState([])
  const [lojaSel, setLojaSel] = useState('')
  const [mesSel, setMesSel] = useState(new Date().getMonth() + 1)
  const [anoSel, setAnoSel] = useState(new Date().getFullYear())
  const [gerando, setGerando] = useState(false)
  const [nome, setNome] = useState(user?.displayName || '')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [msgNome, setMsgNome] = useState('')
  const [msgSenha, setMsgSenha] = useState('')
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [horario, setHorario] = useState(localStorage.getItem('klosr-lembrete') || '18:00')
  const [permissao, setPermissao] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [msgLembrete, setMsgLembrete] = useState('')
  const [secaoAberta, setSecaoAberta] = useState(null)

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const anos = [2024, 2025, 2026, 2027]

  useEffect(() => {
    if (!perfil) return
    const lojasPermitidas = (perfil?.cargo === 'admin' || perfil?.cargo === 'superadmin') ? null : perfil?.lojas
    getLojas(user.uid, lojasPermitidas).then(data => {
      setLojas(data)
      if (data.length > 0) setLojaSel(data[0].id)
    })
  }, [perfil])

  function toggleSecao(secao) {
    setSecaoAberta(prev => prev === secao ? null : secao)
  }

  function fmt(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  async function handleAlterarNome() {
    if (!nome.trim()) return
    setSalvandoNome(true)
    try {
      await alterarNome(nome.trim())
      setMsgNome('✅ Nome atualizado!')
    } catch {
      setMsgNome('Erro ao atualizar nome.')
    } finally {
      setSalvandoNome(false)
      setTimeout(() => setMsgNome(''), 3000)
    }
  }

  async function handleAlterarSenha() {
    if (!senhaAtual || !novaSenha) return
    if (novaSenha.length < 6) { setMsgSenha('Mínimo 6 caracteres.'); return }
    setSalvandoSenha(true)
    try {
      await alterarSenha(senhaAtual, novaSenha)
      setMsgSenha('✅ Senha atualizada!')
      setSenhaAtual('')
      setNovaSenha('')
    } catch {
      setMsgSenha('Senha atual incorreta.')
    } finally {
      setSalvandoSenha(false)
      setTimeout(() => setMsgSenha(''), 3000)
    }
  }

  async function pedirPermissao() {
    if (typeof Notification === 'undefined') return
    const resultado = await Notification.requestPermission()
    setPermissao(resultado)
  }

  function salvarLembrete() {
    if (permissao !== 'granted') {
      setMsgLembrete('Permita as notificações primeiro.')
      return
    }
    localStorage.setItem('klosr-lembrete', horario)
    setMsgLembrete('✅ Lembrete salvo!')
    setTimeout(() => setMsgLembrete(''), 3000)
    const [horas, minutos] = horario.split(':').map(Number)
    const agora = new Date()
    const alvo = new Date()
    alvo.setHours(horas, minutos, 0, 0)
    if (alvo <= agora) alvo.setDate(alvo.getDate() + 1)
    setTimeout(() => {
      new Notification('Klosr Finance 💜', {
        body: 'Não esqueça de fazer o fechamento de caixa de hoje!',
        icon: '/favicon.ico',
      })
    }, alvo - agora)
  }

  async function gerarPDF() {
    if (!lojaSel) return
    setGerando(true)
    try {
      const loja = lojas.find(l => l.id === lojaSel)
      const fechamentos = await getFechamentos(lojaSel)
      const filtrados = fechamentos
        .filter(f => {
          const [ano, mes] = f.data.split('-')
          return parseInt(mes) === mesSel && parseInt(ano) === anoSel
        })
        .sort((a, b) => a.data.localeCompare(b.data))

      const doc = new jsPDF()
      const mesNome = meses[mesSel - 1]
      const W = doc.internal.pageSize.getWidth()

      const tableStyles = {
        styles: { fillColor: [20, 0, 40], textColor: [216, 180, 254], fontSize: 9, lineColor: [88, 28, 135], lineWidth: 0.3 },
        headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [30, 0, 60] },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
      }

      // Fundo roxo escuro
      doc.setFillColor(11, 0, 20)
      doc.rect(0, 0, W, 297, 'F')

      // Header
      doc.setFillColor(88, 28, 135)
      doc.rect(0, 0, W, 18, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('KLOSR FINANCE', 14, 12)
      doc.setFont('helvetica', 'normal')
      doc.text(`${loja?.nome} — ${mesNome} ${anoSel}`, W - 14, 12, { align: 'right' })

      // Totais gerais
      let totalEntradas = 0, totalGastos = 0
      filtrados.forEach(f => {
        totalEntradas += (f.pix || 0) + (f.cartao || 0) + (f.dinheiro || 0)
        totalGastos += (f.gastos || []).reduce((s, g) => s + (g.val || 0), 0)
      })
      const totalSaldo = totalEntradas - totalGastos

      // Título resumo
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(216, 180, 254)
      doc.text('Resumo do Mês', 14, 34)
      doc.setDrawColor(88, 28, 135)
      doc.setLineWidth(0.4)
      doc.line(14, 37, W - 14, 37)

      // 3 cards
      const cards = [
        { label: 'Total Entradas', value: fmt(totalEntradas), cor: [167, 243, 208], bg: [20, 83, 45] },
        { label: 'Total Gastos',   value: fmt(totalGastos),   cor: [252, 165, 165], bg: [127, 29, 29] },
        { label: 'Saldo Final',    value: fmt(totalSaldo),    cor: totalSaldo >= 0 ? [167, 243, 208] : [252, 165, 165], bg: totalSaldo >= 0 ? [20, 83, 45] : [127, 29, 29] },
      ]
      const cardW = (W - 28 - 8) / 3
      cards.forEach((c, i) => {
        const x = 14 + i * (cardW + 4)
        doc.setFillColor(...c.bg)
        doc.roundedRect(x, 42, cardW, 28, 4, 4, 'F')
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...c.cor)
        doc.text(c.label.toUpperCase(), x + cardW / 2, 51, { align: 'center' })
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(c.value, x + cardW / 2, 62, { align: 'center' })
      })

      // Formas de pagamento
      let totalPix = 0, totalCartao = 0, totalDinheiro = 0
      filtrados.forEach(f => {
        totalPix += f.pix || 0
        totalCartao += f.cartao || 0
        totalDinheiro += f.dinheiro || 0
      })

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(216, 180, 254)
      doc.text('Entradas por Forma de Pagamento', 14, 86)
      doc.setDrawColor(88, 28, 135)
      doc.line(14, 89, W - 14, 89)

      autoTable(doc, {
        ...tableStyles,
        startY: 93,
        head: [['Forma', 'Total', '% do total']],
        body: [
          ['PIX',      fmt(totalPix),      totalEntradas ? `${((totalPix / totalEntradas) * 100).toFixed(1)}%` : '0%'],
          ['Cartão',   fmt(totalCartao),   totalEntradas ? `${((totalCartao / totalEntradas) * 100).toFixed(1)}%` : '0%'],
          ['Dinheiro', fmt(totalDinheiro), totalEntradas ? `${((totalDinheiro / totalEntradas) * 100).toFixed(1)}%` : '0%'],
        ],
        columnStyles: {
          0: { cellWidth: 110 },
          1: { cellWidth: 46, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' },
        },
      })

      // Gastos por categoria
      const categorias = {}
      filtrados.forEach(f => {
        (f.gastos || []).forEach(g => {
          const chave = (g.desc || 'Outros').trim().toLowerCase()
          const label = (g.desc || 'Outros').trim()
          if (!categorias[chave]) categorias[chave] = { label, total: 0, ocorrencias: 0 }
          categorias[chave].total += g.val || 0
          categorias[chave].ocorrencias += 1
        })
      })
      const categoriasOrdenadas = Object.values(categorias).sort((a, b) => b.total - a.total)
      const y2 = (doc.lastAutoTable?.finalY ?? 126) + 14

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(216, 180, 254)
      doc.text('Gastos por Categoria', 14, y2)
      doc.setDrawColor(88, 28, 135)
      doc.line(14, y2 + 3, W - 14, y2 + 3)

      if (categoriasOrdenadas.length === 0) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(126, 34, 206)
        doc.text('Nenhum gasto registrado neste mês.', 14, y2 + 14)
      } else {
        autoTable(doc, {
          ...tableStyles,
          startY: y2 + 7,
          head: [['Categoria', 'Ocorrências', 'Total gasto', '% dos gastos']],
          body: categoriasOrdenadas.map(c => [
            c.label,
            `${c.ocorrencias}x`,
            fmt(c.total),
            totalGastos ? `${((c.total / totalGastos) * 100).toFixed(1)}%` : '0%',
          ]),
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 56, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' },
          },
        })
      }

      doc.save(`klosr-${loja?.nome}-${mesNome}-${anoSel}.pdf`)
    } catch (err) {
      console.error(err)
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="min-h-screen pb-10 relative bg-gradient-to-br from-[#0b0014] via-[#14002a] to-[#1a0033] overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-5 pt-12 pb-6 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white">
          ←
        </button>
        <div>
          <p className="text-xs font-semibold text-purple-400">Klosr Finance</p>
          <h1 className="text-lg font-black text-white">Configurações</h1>
        </div>
      </div>

      {/* Cards */}
      <div className="relative z-10 flex flex-col gap-3 px-5">

        {/* Dados */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
          <button onClick={() => toggleSecao('dados')} className={`w-full flex items-center gap-4 p-4 text-left transition-all ${secaoAberta === 'dados' ? 'border-b border-white/10' : ''}`}>
            <span className="text-xl">👤</span>
            <div className="flex-1">
              <p className="font-bold text-sm text-white">Dados</p>
              <p className="text-xs mt-0.5 text-purple-400">{user?.email}</p>
            </div>
            <span className={`text-purple-400 transition-transform text-lg ${secaoAberta === 'dados' ? 'rotate-90' : ''}`}>›</span>
          </button>
          {secaoAberta === 'dados' && (
            <div className="p-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-purple-400">Email</label>
              <div className="w-full mt-1 mb-3 px-4 py-3 rounded-xl text-sm border bg-white/5 border-white/10 text-purple-400">{user?.email}</div>
              <label className="text-xs font-semibold uppercase tracking-wide text-purple-400">Nome de exibição</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João"
                className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white placeholder-purple-700 focus:border-purple-500 transition-all" />
              {msgNome && <p className={`text-xs mt-2 ${msgNome.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>{msgNome}</p>}
              <button onClick={handleAlterarNome} disabled={salvandoNome}
                className="w-full mt-3 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-900/40">
                {salvandoNome ? 'Salvando...' : 'Salvar nome'}
              </button>
            </div>
          )}
        </div>

        {/* Senha */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
          <button onClick={() => toggleSecao('senha')} className={`w-full flex items-center gap-4 p-4 text-left transition-all ${secaoAberta === 'senha' ? 'border-b border-white/10' : ''}`}>
            <span className="text-xl">🔒</span>
            <div className="flex-1">
              <p className="font-bold text-sm text-white">Alterar senha</p>
              <p className="text-xs mt-0.5 text-purple-400">Clique para alterar sua senha</p>
            </div>
            <span className={`text-purple-400 transition-transform text-lg ${secaoAberta === 'senha' ? 'rotate-90' : ''}`}>›</span>
          </button>
          {secaoAberta === 'senha' && (
            <div className="p-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-purple-400">Senha atual</label>
              <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="••••••••"
                className="w-full mt-1 mb-3 px-4 py-3 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white placeholder-purple-700 focus:border-purple-500 transition-all" />
              <label className="text-xs font-semibold uppercase tracking-wide text-purple-400">Nova senha</label>
              <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="••••••••"
                className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white placeholder-purple-700 focus:border-purple-500 transition-all" />
              {msgSenha && <p className={`text-xs mt-2 ${msgSenha.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>{msgSenha}</p>}
              <button onClick={handleAlterarSenha} disabled={salvandoSenha}
                className="w-full mt-3 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-900/40">
                {salvandoSenha ? 'Salvando...' : 'Alterar senha'}
              </button>
            </div>
          )}
        </div>

        {/* Lembrete */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
          <button onClick={() => toggleSecao('lembrete')} className={`w-full flex items-center gap-4 p-4 text-left transition-all ${secaoAberta === 'lembrete' ? 'border-b border-white/10' : ''}`}>
            <span className="text-xl">🔔</span>
            <div className="flex-1">
              <p className="font-bold text-sm text-white">Lembrete de fechamento</p>
              <p className="text-xs mt-0.5 text-purple-400">Notificação diária para não esquecer</p>
            </div>
            <span className={`text-purple-400 transition-transform text-lg ${secaoAberta === 'lembrete' ? 'border-b border-white/10' : ''}`}>›</span>
          </button>
          {secaoAberta === 'lembrete' && (
            <div className="p-4">
              {permissao !== 'granted' ? (
                <div className="mb-4">
                  <p className="text-sm mb-3 text-purple-300">Para receber lembretes, permita as notificações do navegador.</p>
                  <button onClick={pedirPermissao}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-900/40">
                    🔔 Permitir notificações
                  </button>
                </div>
              ) : (
                <p className="text-green-400 text-xs mb-3">✅ Notificações permitidas</p>
              )}
              <label className="text-xs font-semibold uppercase tracking-wide text-purple-400">Horário do lembrete</label>
              <input type="time" value={horario} onChange={e => setHorario(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white focus:border-purple-500 transition-all" />
              {msgLembrete && <p className={`text-xs mt-2 ${msgLembrete.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>{msgLembrete}</p>}
              <button onClick={salvarLembrete}
                className="w-full mt-3 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-900/40">
                Salvar lembrete
              </button>
            </div>
          )}
        </div>

        {/* PDF */}
        {perfil?.cargo !== 'funcionario' && (
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
            <button onClick={() => toggleSecao('pdf')} className={`w-full flex items-center gap-4 p-4 text-left transition-all ${secaoAberta === 'pdf' ? 'border-b border-white/10' : ''}`}>
              <span className="text-xl">📄</span>
              <div className="flex-1">
                <p className="font-bold text-sm text-white">Exportar relatório em PDF</p>
                <p className="text-xs mt-0.5 text-purple-400">Baixar fechamentos por loja e mês</p>
              </div>
              <span className={`text-purple-400 transition-transform text-lg ${secaoAberta === 'pdf' ? 'rotate-90' : ''}`}>›</span>
            </button>
            {secaoAberta === 'pdf' && (
              <div className="p-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-purple-400">Loja</label>
                <select value={lojaSel} onChange={e => setLojaSel(e.target.value)}
                  className="w-full mt-1 mb-3 px-4 py-3 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white focus:border-purple-500 transition-all">
                  {lojas.map(l => <option key={l.id} value={l.id} className="bg-[#14002a]">{l.icon} {l.nome}</option>)}
                </select>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-purple-400">Mês</label>
                    <select value={mesSel} onChange={e => setMesSel(Number(e.target.value))}
                      className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white focus:border-purple-500 transition-all">
                      {meses.map((m, i) => <option key={i} value={i + 1} className="bg-[#14002a]">{m}</option>)}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="text-xs font-semibold uppercase tracking-wide text-purple-400">Ano</label>
                    <select value={anoSel} onChange={e => setAnoSel(Number(e.target.value))}
                      className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white focus:border-purple-500 transition-all">
                      {anos.map(a => <option key={a} value={a} className="bg-[#14002a]">{a}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={gerarPDF} disabled={gerando || !lojaSel}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-fuchsia-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40">
                  {gerando ? 'Gerando PDF...' : '⬇️ Baixar PDF'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}