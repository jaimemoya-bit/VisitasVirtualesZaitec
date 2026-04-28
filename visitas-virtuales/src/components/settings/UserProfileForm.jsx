import { Pencil, RotateCcw, Save, User } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function UserProfileForm() {
  const { authState, centerState, fetchProfile } = useAuth();
      const { user } = authState;
      const { allCenters } = centerState;
      const userImageRef = useRef(null);
      const userFormInitialState = {
          username: user?.username || '',
          email: user?.email || '',
          centerPreferenceId: String(user.centerPreferenceId) || '',
      };

    const [userFormState, setUserFormState] = useState(userFormInitialState);
    const [preview, setPreview] = useState(user?.imageUrl || `https://api.dicebear.com/9.x/identicon/svg?seed=${user?.email}`);
    console.log(preview)

    const updateUserAction = async (formData) => {
        // Eliminar el campo de centro si no se ha seleccionado ninguno
        if (formData.get('centerPreferenceId') === '') {
            formData.delete('centerPreferenceId');
        }
        
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/me', {
                method: 'PATCH',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                // Refrescar datos del perfil después de la actualización
                fetchProfile(); 
                alert('Perfil actualizado exitosamente');
            } else {
                const errorData = await response.text();
                console.error('Error del servidor al actualizar el perfil:', errorData);
                alert(`Error: ${response.status} - No se pudo actualizar el perfil`);
            }
        } catch (error) {
            console.error('Error de red al actualizar el perfil:', error);
            alert('Error de red al actualizar el perfil. Por favor, inténtalo más tarde.');
        }
    }

    const resetChanges = async () => {
        setUserFormState(userFormInitialState);
    }

    const handleUserImageChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setPreview(URL.createObjectURL(selectedFile));
        }
    }

    return (
      <form action={updateUserAction} className="grid grid-cols-3 gap-10">
                                <div className='col-span-1 flex flex-col justify-center items-center gap-4'>
                                    <h3 className="text-sm text-slate-600 mb-2 font-medium self-start">Foto de perfil:</h3>
                                    <div className='relative'>
                                        <figure className="w-32 h-32 rounded-full overflow-hidden mb-4">
                                            <img 
                                                src={preview}
                                                alt="User Avatar" 
                                                className="w-full h-full object-cover"
                                            />
                                            
                                        </figure>
                                        <div className="absolute bottom-2 right-2 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => userImageRef.current.click()}>
                                            <Pencil className="w-4 h-4 text-white" />
                                        </div>
                                        <input name="file" type='file' onChange={handleUserImageChange} ref={userImageRef} className='hidden'/>
                                    </div>
                                </div>
                                <div className='col-span-2 flex flex-col'>
                                    <div>
                                        <p className="text-sm text-slate-600 mb-2 font-medium">Nombre de usuario</p>
                                    <Input type="text" name="username" value={userFormState.username} onChange={(e) => setUserFormState(prev => ({ ...prev, username: e.target.value }))} defaultValue={user?.username} placeholder="Tu nombre de usuario" className="mb-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 mb-2 font-medium">Correo electrónico</p>
                                        <Input type="email" name="email" defaultValue={userFormState.email} onChange={(e) => setUserFormState(prev => ({ ...prev, email: e.target.value }))} placeholder="Tu correo electrónico" className="mb-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 mb-2 font-medium">Centro educativo predeterminado</p>
                                        <Select name='centerPreferenceId' options={allCenters} value={userFormState.centerPreferenceId} onChange={(e) => setUserFormState(prev => ({ ...prev, centerPreferenceId: e.target.value }))} defaultValue={userFormState.centerPreferenceId} />
                                    </div>
                                    <div className='flex w-full justify-end gap-2 mt-6'>
                                        <Button type="button" variant="tertiary" onClick={resetChanges}><RotateCcw className='w-5 h-5' />Olvidar cambios</Button>
                                        <Button type="submit" variant="primary"><Save className='w-5 h-5' />Guardar cambios</Button>
                                    </div>
                                </div>
                        </form>
    );
}
