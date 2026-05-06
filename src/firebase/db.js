import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  query, 
  where,
  orderBy
} from "firebase/firestore"
import { db } from "./config"

export async function getLojas(userId, lojasPermitidas = null) {
  // Moderador/funcionario — só as lojas permitidas
  if (lojasPermitidas && lojasPermitidas.length > 0) {
    const promises = lojasPermitidas
      .filter(id => !!id) // garante que não tem undefined
      .map(id => getDoc(doc(db, "lojas", id)))
    const snaps = await Promise.all(promises)
    return snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }))
  }

  // Admin/Superadmin — busca todas as lojas
  const snapshot = await getDocs(collection(db, "lojas"))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function addLoja(userId, loja) {
  return addDoc(collection(db, "lojas"), { ...loja, userId })
}

export async function updateLoja(lojaId, dados) {
  return updateDoc(doc(db, "lojas", lojaId), dados)
}

export async function deleteLoja(lojaId) {
  return deleteDoc(doc(db, "lojas", lojaId))
}

export async function getFechamentos(lojaId) {
  const q = query(
    collection(db, "fechamentos"), 
    where("lojaId", "==", lojaId),
    orderBy("data", "desc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function saveFechamento(lojaId, dados) {
  const id = `${lojaId}_${dados.data}`
  return setDoc(doc(db, "fechamentos", id), { ...dados, lojaId })
}

export async function getFechamento(lojaId, data) {
  const id = `${lojaId}_${data}`
  const snap = await getDoc(doc(db, "fechamentos", id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getUsuario(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function criarUsuario(uid, dados) {
  return setDoc(doc(db, "usuarios", uid), dados)
}

// ── Categorias do inventário ──────────────────────────────────────────────────

export async function getCategorias(lojaId) {
  const q = query(
    collection(db, "categorias"),
    where("lojaId", "==", lojaId),
    orderBy("ordem", "asc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function addCategoria(lojaId, nome) {
  const snap = await getDocs(query(collection(db, "categorias"), where("lojaId", "==", lojaId)))
  return addDoc(collection(db, "categorias"), {
    lojaId,
    nome,
    ordem: snap.size
  })
}

export async function deleteCategoria(categoriaId) {
  return deleteDoc(doc(db, "categorias", categoriaId))
}

// ── Itens do inventário ───────────────────────────────────────────────────────

export async function getItensInventario(lojaId) {
  const q = query(
    collection(db, "inventario"),
    where("lojaId", "==", lojaId),
    orderBy("ordem", "asc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function addItemInventario(lojaId, categoriaId, nome) {
  const snap = await getDocs(query(collection(db, "inventario"), where("categoriaId", "==", categoriaId)))
  return addDoc(collection(db, "inventario"), {
    lojaId,
    categoriaId,
    nome,
    falta: false,
    extra: false,
    ordem: snap.size,
    atualizadoEm: new Date().toISOString()
  })
}

export async function updateItemInventario(itemId, dados) {
  return updateDoc(doc(db, "inventario", itemId), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  })
}

export async function deleteItemInventario(itemId) {
  return deleteDoc(doc(db, "inventario", itemId))
}

// ── Fechamentos de funcionário ────────────────────────────────────────────────

export async function saveFechamentoFuncionario(lojaId, userId, dados) {
  const id = `${lojaId}_${userId}_${dados.data}`
  return setDoc(doc(db, "fechamentosFuncionario", id), {
    ...dados,
    lojaId,
    userId,
    criadoEm: dados.criadoEm || new Date().toISOString()
  })
}

export async function getFechamentoFuncionario(lojaId, userId, data) {
  const id = `${lojaId}_${userId}_${data}`
  const snap = await getDoc(doc(db, "fechamentosFuncionario", id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getFechamentosFuncionariosByLoja(lojaId) {
  const q = query(
    collection(db, "fechamentosFuncionario"),
    where("lojaId", "==", lojaId),
    orderBy("data", "desc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// ── Extras do inventário ──────────────────────────────────────────────────────

export async function getExtrasInventario(lojaId) {
  const q = query(
    collection(db, "inventarioExtras"),
    where("lojaId", "==", lojaId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function addExtraInventario(lojaId, nome, userId, nomeUsuario) {
  return addDoc(collection(db, "inventarioExtras"), {
    lojaId,
    nome,
    userId,
    nomeUsuario,
    criadoEm: new Date().toISOString()
  })
}

export async function deleteExtraInventario(extraId) {
  return deleteDoc(doc(db, "inventarioExtras", extraId))
}