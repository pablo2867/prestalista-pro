import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || ''
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (estado) query = query.eq('estado', estado)
    const { data, error } = await query
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    
    const metrics = {
      total: data?.length || 0,
      nuevos: data?.filter((l:any)=>l.estado==='nuevo').length||0,
      contactados: data?.filter((l:any)=>l.estado==='contactado').length||0,
      calificados: data?.filter((l:any)=>l.estado==='calificado').length||0,
      convertidos: data?.filter((l:any)=>l.estado==='convertido').length||0,
      perdidos: data?.filter((l:any)=>l.estado==='perdido').length||0,
      totalInteres: data?.reduce((s:number,l:any)=>s+parseFloat(l.monto_interes||0),0)||0
    }
    return NextResponse.json({ success: true, leads: data||[], metrics }, { status: 200 })
  } catch(err:any){
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, apellido, telefono, email, origen, monto_interes, proposito, prioridad, notas } = body
    if(!nombre||!apellido||!telefono) return NextResponse.json({success:false,error:'Nombre, apellido y teléfono son obligatorios'},{status:400})
    const {data:inserted,error} = await supabase.from('leads').insert({
      nombre:nombre.trim(), apellido:apellido.trim(), telefono:telefono.trim(),
      email:email?.trim()?.toLowerCase()||null, origen:origen||'otro',
      estado:'nuevo', monto_interes:monto_interes?parseFloat(monto_interes):null,
      proposito:proposito?.trim()||null, prioridad:prioridad||'media', notas:notas?.trim()||null
    }).select().single()
    if(error) return NextResponse.json({success:false,error:error.message},{status:500})
    return NextResponse.json({success:true,data:inserted},{status:201})
  } catch(err:any){
    return NextResponse.json({success:false,error:err.message},{status:500})
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const {id,estado,prestatario_id} = await request.json()
    if(!id) return NextResponse.json({success:false,error:'ID requerido'},{status:400})
    const updateData:any={estado}
    if(estado==='convertido'&&prestatario_id){updateData.prestatario_id=prestatario_id;updateData.fecha_conversion=new Date().toISOString().split('T')[0]}
    const {data:updated,error}=await supabase.from('leads').update(updateData).eq('id',id).select().single()
    if(error) return NextResponse.json({success:false,error:error.message},{status:500})
    return NextResponse.json({success:true,data:updated},{status:200})
  } catch(err:any){
    return NextResponse.json({success:false,error:err.message},{status:500})
  }
}