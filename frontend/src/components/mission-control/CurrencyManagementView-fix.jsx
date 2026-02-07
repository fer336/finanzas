// Agregar esta función después de handleDeleteCurrency y antes de getIconEmoji:

  // Mapear nombre de icono (string) al componente de Lucide
  const getIconComponent = (iconName) => {
    if (!iconName) return DollarSign;
    const IconComponent = LucideIcons[iconName];
    return IconComponent || DollarSign;
  };

  // Renderizar icono de Lucide
  const renderIcon = (iconName, className = "w-5 h-5") => {
    const IconComponent = getIconComponent(iconName);
    return <IconComponent className={className} />;
  };

